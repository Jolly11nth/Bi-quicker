from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from .database import engine
from .models import Base, Location

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bi-quicker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LocationPayload(BaseModel):
    email: str
    role: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "bi-quicker-api"}

@app.get("/health/database")
def database_health() -> dict[str, str]:
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")
    return {"status": "ok", "database": "connected"}

@app.post("/api/locations")
def save_location(payload: LocationPayload) -> dict[str, str]:
    with Session(engine) as db:
        location = db.scalar(select(Location).where(Location.owner_email == payload.email.lower()))
        if location is None:
            location = Location(owner_email=payload.email.lower(), owner_role=payload.role, latitude=payload.latitude, longitude=payload.longitude)
            db.add(location)
        else:
            location.owner_role = payload.role
            location.latitude = payload.latitude
            location.longitude = payload.longitude
        db.commit()
    return {"status": "saved"}

@app.get("/api/locations/{email}")
def get_location(email: str):
    with Session(engine) as db:
        location = db.scalar(select(Location).where(Location.owner_email == email.lower()))
        if location is None:
            raise HTTPException(status_code=404, detail="Location not found")
        return {"email": location.owner_email, "role": location.owner_role, "latitude": location.latitude, "longitude": location.longitude}

STATIC_DIR = Path(__file__).parent / "static"

@app.get("/{path:path}")
def frontend(path: str):
    requested = STATIC_DIR / path
    if path and requested.is_file():
        return FileResponse(requested)
    return FileResponse(STATIC_DIR / "index.html")
