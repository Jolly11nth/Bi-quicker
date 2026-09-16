import json
import os
import secrets
from pathlib import Path

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import create_session, hash_password, read_session, verify_password
from .commerce import (
    MAINTENANCE_RATE,
    OrderRecord,
    VendorRecord,
    dump,
    load,
    maintenance_fee,
    rider_fee,
    seed_vendors,
    utcnow,
)
from .database import engine
from .models import Base, Location, User
from .payments import initialize_transaction, verify_transaction

Base.metadata.create_all(bind=engine)
with Session(engine) as _db:
    seed_vendors(_db)

app = FastAPI(title="Bi-quicker API", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuthPayload(BaseModel):
    email: str
    password: str
    role: str


class SignupPayload(AuthPayload):
    name: str
    data: dict[str, str] = Field(default_factory=dict)


class LocationPayload(BaseModel):
    email: str
    role: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class OrderItemPayload(BaseModel):
    productId: str
    quantity: int = Field(ge=1)


class OrderCreatePayload(BaseModel):
    vendorId: str
    items: list[OrderItemPayload] = Field(min_length=1)


class MessagePayload(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class PaymentVerifyPayload(BaseModel):
    reference: str = Field(min_length=3, max_length=100)


DEMO_ACCOUNTS = {
    "customer": ("you@example.com", "Demo Customer"),
    "store": ("store@example.com", "Fresh Basket"),
    "rider": ("rider@example.com", "Demo Rider"),
    "admin": ("admin@bi-quicker.com", "Super Admin"),
}
RIDERS = [
    {"email": "rider@example.com", "name": "Demo Rider"},
    {"email": "rider2@example.com", "name": "Samuel Rider"},
    {"email": "rider3@example.com", "name": "Daniel Rider"},
]
ORDER_SEQUENCE = ["Awaiting payment", "Paid", "Preparing", "Rider assigned", "Picked up", "In transit", "Delivered"]


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_role(role: str) -> None:
    if role not in {"customer", "store", "rider", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid account role")


def current_session(authorization: str | None) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    session = read_session(authorization.split(" ", 1)[1].strip())
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return session


def order_dict(row: OrderRecord) -> dict:
    return {
        "id": row.id,
        "customerEmail": row.customer_email,
        "customerName": row.customer_name,
        "vendorId": row.vendor_id,
        "vendorName": row.vendor_name,
        "vendorOwnerEmail": row.vendor_owner_email,
        "items": load(row.items_json, []),
        "subtotal": row.subtotal,
        "maintenanceFee": row.maintenance_fee,
        "maintenanceRate": row.maintenance_rate,
        "deliveryDistanceKm": row.delivery_distance_km,
        "deliveryMinutes": row.delivery_minutes,
        "deliveryFee": row.delivery_fee,
        "total": row.total,
        "status": row.status,
        "riderEmail": row.rider_email,
        "riderName": row.rider_name,
        "riderAssignedAt": None,
        "payment": load(row.payment_json, {}),
        "participants": load(row.participants_json, []),
        "messages": load(row.messages_json, []),
        "tracking": load(row.tracking_json, []),
        "createdAt": row.created_at.isoformat() if row.created_at else None,
    }


def vendor_dict(row: VendorRecord) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "category": row.category,
        "rating": row.rating,
        "eta": row.eta,
        "ownerEmail": row.owner_email,
        "paymentBank": row.payment_bank,
        "paymentAccountName": row.payment_account_name,
        "paymentAccountNumber": row.payment_account_number,
        "products": load(row.products_json, []),
    }


def route_between(db: Session, customer_email: str, vendor_owner_email: str) -> tuple[float, float]:
    customer = db.scalar(select(Location).where(Location.owner_email == customer_email, Location.owner_role == "customer"))
    vendor = db.scalar(select(Location).where(Location.owner_email == vendor_owner_email, Location.owner_role == "store"))
    if customer is None or vendor is None:
        raise HTTPException(status_code=400, detail="Delivery route is unavailable. Customer and vendor location access is required before checkout.")
    coordinates = f"{vendor.longitude},{vendor.latitude};{customer.longitude},{customer.latitude}"
    try:
        response = httpx.get(
            f"https://router.project-osrm.org/route/v1/driving/{coordinates}?overview=false",
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        route = data.get("routes", [None])[0]
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Routing service is temporarily unavailable. Please try again.") from exc
    if data.get("code") != "Ok" or not route:
        raise HTTPException(status_code=404, detail="No drivable route found between the customer and vendor.")
    return route["distance"] / 1000, route["duration"] / 60


def tracking_events(created_at: str) -> list[dict]:
    labels = [
        ("placed", "Awaiting payment", "Order placed", "Order created and waiting for payment confirmation."),
        ("paid", "Paid", "Payment confirmed", "Payment has been verified by the payment gateway."),
        ("preparing", "Preparing", "Vendor preparing order", "The vendor is preparing your package."),
        ("assigned", "Rider assigned", "Rider assigned", "A delivery rider has joined the order."),
        ("pickup", "Picked up", "Package picked up", "The rider has collected the package."),
        ("transit", "In transit", "In transit", "Package is moving toward the customer."),
        ("delivered", "Delivered", "Delivered", "Package delivered successfully."),
    ]
    return [{"id": key, "status": status, "label": label, "detail": detail, "at": created_at if key == "placed" else "", "done": key == "placed"} for key, status, label, detail in labels]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "bi-quicker-api"}


@app.get("/health/database")
def database_health() -> dict[str, str]:
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")
    return {"status": "ok", "database": "connected"}


@app.post("/api/auth/signup")
def signup(payload: SignupPayload):
    validate_role(payload.role)
    if payload.role == "admin":
        raise HTTPException(status_code=403, detail="Super Admin accounts are created by system administrators only")
    email, name = normalize_email(payload.email), payload.name.strip()
    if not name or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Name and a password of at least 6 characters are required")
    with Session(engine) as db:
        if db.scalar(select(User).where(User.email == email, User.role == payload.role)):
            raise HTTPException(status_code=409, detail="An account with this email already exists for this role")
        db.add(User(email=email, name=name, role=payload.role, password_hash=hash_password(payload.password), profile_data=json.dumps(payload.data)))
        db.commit()
    return {"status": "created", "email": email, "role": payload.role}


@app.post("/api/auth/signin")
def signin(payload: AuthPayload):
    validate_role(payload.role)
    email = normalize_email(payload.email)
    demo = DEMO_ACCOUNTS.get(payload.role)
    if demo and email == demo[0] and payload.password == "demo123":
        return {"token": create_session(email, payload.role, demo[1]), "session": {"role": payload.role, "email": email, "name": demo[1]}}
    with Session(engine) as db:
        user = db.scalar(select(User).where(User.email == email, User.role == payload.role))
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        name = user.name
    return {"token": create_session(email, payload.role, name), "session": {"role": payload.role, "email": email, "name": name}}


@app.post("/api/locations")
def save_location(payload: LocationPayload, authorization: str | None = Header(default=None)):
    session = current_session(authorization)
    validate_role(payload.role)
    email = normalize_email(payload.email)
    if session["email"] != email or session["role"] != payload.role:
        raise HTTPException(status_code=403, detail="You can only save your own location")
    with Session(engine) as db:
        location = db.scalar(select(Location).where(Location.owner_email == email, Location.owner_role == payload.role))
        if location is None:
            db.add(Location(owner_email=email, owner_role=payload.role, latitude=payload.latitude, longitude=payload.longitude))
        else:
            location.latitude, location.longitude = payload.latitude, payload.longitude
        db.commit()
    return {"status": "saved"}


@app.get("/api/locations/{role}/{email}")
def get_location(role: str, email: str, authorization: str | None = Header(default=None)):
    session = current_session(authorization)
    validate_role(role)
    normalized = normalize_email(email)
    if session["role"] != "admin" and session["email"] != normalized:
        raise HTTPException(status_code=403, detail="You can only access your own location")
    with Session(engine) as db:
        location = db.scalar(select(Location).where(Location.owner_email == normalized, Location.owner_role == role))
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"email": location.owner_email, "role": location.owner_role, "latitude": location.latitude, "longitude": location.longitude}


@app.get("/api/vendors")
def vendors():
    with Session(engine) as db:
        return [vendor_dict(v) for v in db.scalars(select(VendorRecord).order_by(VendorRecord.name)).all()]


@app.post("/api/orders")
def create_order(payload: OrderCreatePayload, authorization: str | None = Header(default=None)):
    session = current_session(authorization)
    if session["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can create orders")
    with Session(engine) as db:
        vendor = db.get(VendorRecord, payload.vendorId)
        if vendor is None:
            raise HTTPException(status_code=404, detail="Vendor not found")
        products = {item["id"]: item for item in load(vendor.products_json, [])}
        items: list[dict] = []
        subtotal = 0.0
        for requested in payload.items:
            product = products.get(requested.productId)
            if product is None:
                raise HTTPException(status_code=400, detail=f"Product {requested.productId} is no longer available")
            if requested.quantity > product["stock"]:
                raise HTTPException(status_code=400, detail=f"Only {product['stock']} units of {product['name']} are available")
            line = {"productId": product["id"], "name": product["name"], "price": product["price"], "quantity": requested.quantity}
            items.append(line)
            subtotal += product["price"] * requested.quantity
        distance_km, duration_minutes = route_between(db, normalize_email(session["email"]), vendor.owner_email)
        try:
            delivery_fee = rider_fee(distance_km)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        maintenance = maintenance_fee(subtotal)
        total = subtotal + maintenance + delivery_fee
        order_id = f"BQ-{secrets.token_hex(4).upper()}"
        created_at = utcnow()
        payment_reference = f"BQ-{secrets.token_hex(6).upper()}"
        payment = {
            "provider": "paystack",
            "reference": payment_reference,
            "status": "unpaid",
            "confirmed": False,
            "currency": "NGN",
            "amount": total,
            "authorizationUrl": "",
        }
        participants = [
            {"role": "customer", "email": session["email"], "name": session["name"], "active": True},
            {"role": "store", "email": vendor.owner_email, "name": vendor.name, "active": True},
        ]
        messages = [{"id": f"{order_id}-system", "senderRole": "system", "senderEmail": "system", "senderName": "Bi-quicker", "body": f"Order {order_id} created. Complete secure payment to continue.", "at": created_at, "system": True}]
        row = OrderRecord(
            id=order_id, customer_email=session["email"], customer_name=session["name"], vendor_id=vendor.id,
            vendor_name=vendor.name, vendor_owner_email=vendor.owner_email, items_json=dump(items), subtotal=subtotal,
            maintenance_fee=maintenance, maintenance_rate=MAINTENANCE_RATE, delivery_distance_km=distance_km,
            delivery_minutes=duration_minutes, delivery_fee=delivery_fee, total=total, status="Awaiting payment",
            payment_json=dump(payment), participants_json=dump(participants), messages_json=dump(messages),
            tracking_json=dump(tracking_events(created_at)),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return order_dict(row)


@app.get("/api/orders")
def orders(authorization: str | None = Header(default=None)):
    session = current_session(authorization)
    with Session(engine) as db:
        rows = db.scalars(select(OrderRecord).order_by(OrderRecord.created_at.desc())).all()
        if session["role"] == "customer": rows = [r for r in rows if r.customer_email == session["email"]]
        elif session["role"] == "store": rows = [r for r in rows if r.vendor_owner_email == session["email"]]
        elif session["role"] == "rider": rows = [r for r in rows if r.rider_email == session["email"]]
        return [order_dict(r) for r in rows]


@app.get("/api/orders/{order_id}")
def order(order_id: str, authorization: str | None = Header(default=None)):
    session = current_session(authorization)
    with Session(engine) as db:
        row = db.get(OrderRecord, order_id)
        if row is None: raise HTTPException(status_code=404, detail="Order not found")
        allowed = session["role"] == "admin" or session["email"] in {row.customer_email, row.vendor_owner_email, row.rider_email}
        if not allowed: raise HTTPException(status_code=403, detail="You do not have access to this order")
        return order_dict(row)


@app.post("/api/orders/{order_id}/messages")
def add_message(order_id: str, payload: MessagePayload, authorization: str | None = Header(default=None)):
    session = current_session(authorization)
    with Session(engine) as db:
        row = db.get(OrderRecord, order_id)
        if row is None: raise HTTPException(status_code=404, detail="Order not found")
        participants = load(row.participants_json, [])
        allowed = session["role"] == "admin" or any(p.get("email") == session["email"] and p.get("active") for p in participants)
        if not allowed: raise HTTPException(status_code=403, detail="You are not a participant in this order")
        messages = load(row.messages_json, [])
        messages.append({"id": f"{order_id}-m-{secrets.token_hex(4)}", "senderRole": session["role"], "senderEmail": session["email"], "senderName": session["name"], "body": payload.body.strip(), "at": utcnow()})
        row.messages_json = dump(messages)
        db.commit()
        return order_dict(row)


@app.post("/api/orders/{order_id}/advance")
def advance_order(order_id: str, authorization: str | None = Header(default=None)):
    session = current_session(authorization)
    with Session(engine) as db:
        row = db.get(OrderRecord, order_id)
        if row is None: raise HTTPException(status_code=404, detail="Order not found")
        if session["role"] == "store" and row.vendor_owner_email != session["email"]: raise HTTPException(status_code=403, detail="Not your store order")
        if session["role"] == "rider" and row.rider_email != session["email"]: raise HTTPException(status_code=403, detail="This delivery is not assigned to you")
        if session["role"] not in {"store", "rider"}: raise HTTPException(status_code=403, detail="This action is not available to your role")
        current = ORDER_SEQUENCE.index(row.status)
        if row.status == "Awaiting payment" or row.status == "Delivered": raise HTTPException(status_code=400, detail="This order cannot be advanced in its current state")
        if session["role"] == "store" and row.status not in {"Paid", "Preparing"}: raise HTTPException(status_code=400, detail="Store cannot advance this order at its current stage")
        if session["role"] == "rider" and row.status not in {"Rider assigned", "Picked up", "In transit"}: raise HTTPException(status_code=400, detail="Rider cannot advance this order at its current stage")
        next_status = ORDER_SEQUENCE[current + 1]
        at = utcnow()
        if next_status == "Rider assigned":
            rider = next((r for r in RIDERS if r["email"] != row.rider_email), RIDERS[0])
            row.rider_email, row.rider_name = rider["email"], rider["name"]
            participants = load(row.participants_json, [])
            participants.append({"role": "rider", "email": rider["email"], "name": rider["name"], "active": True})
            row.participants_json = dump(participants)
            messages = load(row.messages_json, [])
            messages.append({"id": f"{order_id}-rider-{secrets.token_hex(4)}", "senderRole": "system", "senderEmail": "system", "senderName": "Bi-quicker", "body": f"{rider['name']} has been assigned to this delivery.", "at": at, "system": True})
            row.messages_json = dump(messages)
        row.status = next_status
        tracking = load(row.tracking_json, [])
        target = ORDER_SEQUENCE.index(next_status)
        for index, event in enumerate(tracking):
            if index <= target:
                event["done"] = True
                if not event.get("at"): event["at"] = at
        row.tracking_json = dump(tracking)
        db.commit()
        return order_dict(row)


@app.post("/api/orders/{order_id}/payment/initialize")
def initialize_payment(order_id: str, authorization: str | None = Header(default=None)):
    session = current_session(authorization)
    with Session(engine) as db:
        row = db.get(OrderRecord, order_id)
        if row is None: raise HTTPException(status_code=404, detail="Order not found")
        if row.customer_email != session["email"]: raise HTTPException(status_code=403, detail="Only the customer can initialize this payment")
        payment = load(row.payment_json, {})
        if payment.get("confirmed"): return payment
        try:
            callback = os.environ.get("PAYSTACK_CALLBACK_URL", "") or None
            data = initialize_transaction(email=row.customer_email, amount_naira=row.total, reference=payment["reference"], callback_url=callback, metadata={"order_id": row.id, "vendor_id": row.vendor_id})
        except (RuntimeError, ValueError) as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        payment.update({"status": "initialized", "authorizationUrl": data["authorization_url"], "accessCode": data["access_code"]})
        row.payment_json = dump(payment)
        db.commit()
        return payment


@app.post("/api/orders/{order_id}/payment/verify")
def verify_payment(order_id: str, payload: PaymentVerifyPayload, authorization: str | None = Header(default=None)):
    session = current_session(authorization)
    with Session(engine) as db:
        row = db.get(OrderRecord, order_id)
        if row is None: raise HTTPException(status_code=404, detail="Order not found")
        if session["role"] not in {"customer", "admin"} and session["email"] != row.vendor_owner_email: raise HTTPException(status_code=403, detail="Not authorized to verify this payment")
        payment = load(row.payment_json, {})
        if payment.get("reference") != payload.reference: raise HTTPException(status_code=400, detail="Payment reference does not match this order")
        try:
            data = verify_transaction(payload.reference)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        expected_kobo = round(row.total * 100)
        if data.get("status") != "success" or int(data.get("amount", 0)) != expected_kobo or data.get("currency") != "NGN":
            raise HTTPException(status_code=400, detail="Payment could not be verified for the expected amount")
        payment.update({"status": "success", "confirmed": True, "verifiedAt": utcnow(), "gatewayTransactionId": data.get("id")})
        row.payment_json = dump(payment)
        if row.status == "Awaiting payment": row.status = "Paid"
        tracking = load(row.tracking_json, [])
        tracking[1]["done"], tracking[1]["at"] = True, payment["verifiedAt"]
        row.tracking_json = dump(tracking)
        db.commit()
        return order_dict(row)


@app.post("/api/routing/road")
def road_route(payload: dict):
    required = ["from_latitude", "from_longitude", "to_latitude", "to_longitude"]
    if any(key not in payload for key in required): raise HTTPException(status_code=400, detail="All route coordinates are required")
    coordinates = f"{payload['from_longitude']},{payload['from_latitude']};{payload['to_longitude']},{payload['to_latitude']}"
    try:
        response = httpx.get(f"https://router.project-osrm.org/route/v1/driving/{coordinates}?overview=false", timeout=15)
        response.raise_for_status(); data = response.json(); route = data.get("routes", [None])[0]
    except Exception as exc: raise HTTPException(status_code=502, detail="Routing service unavailable") from exc
    if data.get("code") != "Ok" or not route: raise HTTPException(status_code=404, detail="No drivable route found")
    return {"distanceKm": route["distance"] / 1000, "durationMinutes": route["duration"] / 60}


STATIC_DIR = Path(__file__).parent / "static"


@app.get("/{path:path}")
def frontend(path: str):
    requested = STATIC_DIR / path
    if path and requested.is_file():
        return FileResponse(requested)
    return FileResponse(STATIC_DIR / "index.html")
