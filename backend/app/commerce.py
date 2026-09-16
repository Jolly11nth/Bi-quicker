from datetime import datetime, timezone
import json
from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from .models import Base

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


def utcnow():
    return datetime.now(timezone.utc).isoformat()

def dump(value):
    return json.dumps(value, separators=(",", ":"))

def load(value, fallback):
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return fallback
