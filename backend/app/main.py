import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import create_session, hash_password, verify_password
from .database import engine
from .models import Base, Location, User

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bi-quicker API", version="1.0.0")

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


DEMO_ACCOUNTS = {
    "customer": ("you@example.com", "Demo Customer"),
    "store": ("store@example.com", "Fresh Basket"),
    "rider": ("rider@example.com", "Demo Rider"),
    "admin": ("admin@bi-quicker.com", "Super Admin"),
}


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_role(role: str) -> None:
    if role not in {"customer", "store", "rider", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid account role")


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

    email = normalize_email(payload.email)
    name = payload.name.strip()
    if not name or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Name and a password of at least 6 characters are required")

    with Session(engine) as db:
        existing = db.scalar(select(User).where(User.email == email, User.role == payload.role))
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists for this role")
        user = User(
            email=email,
            name=name,
            role=payload.role,
            password_hash=hash_password(payload.password),
            profile_data=json.dumps(payload.data),
        )
        db.add(user)
        db.commit()

    return {"status": "created", "email": email, "role": payload.role}


@app.post("/api/auth/signin")
def signin(payload: AuthPayload):
    validate_role(payload.role)
    email = normalize_email(payload.email)

    demo = DEMO_ACCOUNTS.get(payload.role)
    if demo and email == demo[0] and payload.password == "demo123":
        return {
            "token": create_session(email, payload.role, demo[1]),
            "session": {"role": payload.role, "email": email, "name": demo[1]},
        }

    with Session(engine) as db:
        user = db.scalar(select(User).where(User.email == email, User.role == payload.role))
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        name = user.name

    return {
        "token": create_session(email, payload.role, name),
        "session": {"role": payload.role, "email": email, "name": name},
    }


@app.post("/api/locations")
def save_location(payload: LocationPayload) -> dict[str, str]:
    validate_role(payload.role)
    email = normalize_email(payload.email)
    with Session(engine) as db:
        location = db.scalar(
            select(Location).where(Location.owner_email == email, Location.owner_role == payload.role)
        )
        if location is None:
            location = Location(
                owner_email=email,
                owner_role=payload.role,
                latitude=payload.latitude,
                longitude=payload.longitude,
            )
            db.add(location)
        else:
            location.latitude = payload.latitude
            location.longitude = payload.longitude
        db.commit()
    return {"status": "saved"}


@app.get("/api/locations/{role}/{email}")
def get_location(role: str, email: str):
    validate_role(role)
    normalized = normalize_email(email)
    with Session(engine) as db:
        location = db.scalar(
            select(Location).where(Location.owner_email == normalized, Location.owner_role == role)
        )
        if location is None:
            raise HTTPException(status_code=404, detail="Location not found")
        return {
            "email": location.owner_email,
            "role": location.owner_role,
            "latitude": location.latitude,
            "longitude": location.longitude,
        }


STATIC_DIR = Path(__file__).parent / "static"


@app.get("/{path:path}")
def frontend(path: str):
    requested = STATIC_DIR / path
    if path and requested.is_file():
        return FileResponse(requested)
    return FileResponse(STATIC_DIR / "index.html")
