from datetime import datetime, timezone
import json

from sqlalchemy import DateTime, Float, String, Text, func
from sqlalchemy.orm import Mapped, Session, mapped_column

from .models import Base

MAINTENANCE_RATE = 0.03
RIDER_BASE_DISTANCE_KM = 5
RIDER_BASE_FEE = 500


class VendorRecord(Base):
    __tablename__ = "vendors"
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(100))
    rating: Mapped[str] = mapped_column(String(20), default="0")
    eta: Mapped[str] = mapped_column(String(50), default="")
    owner_email: Mapped[str] = mapped_column(String(320), index=True)
    payment_bank: Mapped[str] = mapped_column(String(100), default="")
    payment_account_name: Mapped[str] = mapped_column(String(200), default="")
    payment_account_number: Mapped[str] = mapped_column(String(50), default="")
    products_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class OrderRecord(Base):
    __tablename__ = "orders"
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    customer_email: Mapped[str] = mapped_column(String(320), index=True)
    customer_name: Mapped[str] = mapped_column(String(200))
    vendor_id: Mapped[str] = mapped_column(String(100), index=True)
    vendor_name: Mapped[str] = mapped_column(String(200))
    vendor_owner_email: Mapped[str] = mapped_column(String(320), index=True)
    items_json: Mapped[str] = mapped_column(Text, default="[]")
    subtotal: Mapped[float] = mapped_column(Float)
    maintenance_fee: Mapped[float] = mapped_column(Float)
    maintenance_rate: Mapped[float] = mapped_column(Float)
    delivery_distance_km: Mapped[float] = mapped_column(Float)
    delivery_minutes: Mapped[float] = mapped_column(Float)
    delivery_fee: Mapped[float] = mapped_column(Float)
    total: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(50), index=True)
    rider_email: Mapped[str | None] = mapped_column(String(320), nullable=True, index=True)
    rider_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    payment_json: Mapped[str] = mapped_column(Text, default="{}")
    participants_json: Mapped[str] = mapped_column(Text, default="[]")
    messages_json: Mapped[str] = mapped_column(Text, default="[]")
    tracking_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def dump(value: object) -> str:
    return json.dumps(value, separators=(",", ":"))


def load(value: str | None, fallback: object) -> object:
    try:
        return json.loads(value or "")
    except (TypeError, json.JSONDecodeError):
        return fallback


def rider_fee(distance_km: float) -> int:
    if distance_km <= RIDER_BASE_DISTANCE_KM:
        return RIDER_BASE_FEE
    raise ValueError("Rider pricing for deliveries above 5 km has not been configured yet.")


def maintenance_fee(subtotal: float) -> int:
    return round(max(0, subtotal) * MAINTENANCE_RATE)


def seed_vendors(db: Session) -> None:
    if db.query(VendorRecord).count():
        return
    vendors = [
        ("vendor-fresh-basket", "Fresh Basket", "Groceries", "4.8", "20–35 min", "store@example.com", "GTBank", "Fresh Basket Ltd", "0123456789", [
            {"id": "fb-rice", "name": "Premium Rice 25kg", "description": "Long-grain premium rice.", "price": 28000, "stock": 42},
            {"id": "fb-oil", "name": "Cooking Oil 5L", "description": "Quality cooking oil.", "price": 12500, "stock": 18},
            {"id": "fb-breakfast", "name": "Breakfast Pack", "description": "A family breakfast selection.", "price": 8900, "stock": 12},
        ]),
        ("vendor-tech-hub", "Tech Hub", "Electronics", "4.7", "25–40 min", "techhub@example.com", "Access Bank", "Tech Hub NG", "1029384756", [
            {"id": "th-earbuds", "name": "Wireless Earbuds", "description": "Compact wireless earbuds.", "price": 32000, "stock": 24},
            {"id": "th-charger", "name": "Fast Charger", "description": "USB-C fast charger.", "price": 14500, "stock": 30},
            {"id": "th-cable", "name": "USB-C Cable", "description": "Durable charging cable.", "price": 5500, "stock": 50},
        ]),
        ("vendor-home-store", "Home Store", "Home & Kitchen", "4.6", "30–45 min", "homestore@example.com", "UBA", "Home Store NG", "2019283746", [
            {"id": "hs-kitchen", "name": "Kitchen Set", "description": "Everyday kitchen essentials.", "price": 24500, "stock": 16},
            {"id": "hs-storage", "name": "Storage Set", "description": "Stackable home storage.", "price": 13500, "stock": 22},
            {"id": "hs-lamp", "name": "Table Lamp", "description": "Modern bedside lamp.", "price": 11500, "stock": 14},
        ]),
        ("vendor-market-square", "Market Square", "General", "4.5", "25–40 min", "marketsquare@example.com", "First Bank", "Market Square Stores", "3018273645", [
            {"id": "ms-water", "name": "Bottled Water Pack", "description": "Pack of bottled water.", "price": 4500, "stock": 60},
            {"id": "ms-snacks", "name": "Snack Box", "description": "Assorted snack box.", "price": 7500, "stock": 35},
            {"id": "ms-clean", "name": "Home Cleaning Pack", "description": "Household cleaning essentials.", "price": 12800, "stock": 20},
        ]),
    ]
    for item in vendors:
        db.add(VendorRecord(
            id=item[0], name=item[1], category=item[2], rating=item[3], eta=item[4], owner_email=item[5],
            payment_bank=item[6], payment_account_name=item[7], payment_account_number=item[8], products_json=dump(item[9]),
        ))
    db.commit()
