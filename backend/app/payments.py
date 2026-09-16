import os
from typing import Any

import httpx

PAYSTACK_BASE_URL = "https://api.paystack.co"
PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "").strip()


def _headers() -> dict[str, str]:
    if not PAYSTACK_SECRET_KEY:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
    return {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def initialize_transaction(
    *,
    email: str,
    amount_naira: float,
    reference: str,
    callback_url: str | None,
    metadata: dict[str, Any],
) -> dict[str, Any]:
    if amount_naira <= 0:
        raise ValueError("Payment amount must be greater than zero")
    payload: dict[str, Any] = {
        "email": email,
        "amount": str(round(amount_naira * 100)),
        "currency": "NGN",
        "reference": reference,
        "metadata": metadata,
    }
    if callback_url:
        payload["callback_url"] = callback_url
    try:
        response = httpx.post(
            f"{PAYSTACK_BASE_URL}/transaction/initialize",
            headers=_headers(),
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        body = response.json()
    except Exception as exc:
        raise RuntimeError(f"Payment gateway initialization failed: {exc}") from exc
    if not body.get("status") or not body.get("data"):
        raise RuntimeError(body.get("message", "Unable to initialize payment"))
    return body["data"]


def verify_transaction(reference: str) -> dict[str, Any]:
    try:
        response = httpx.get(
            f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
            headers=_headers(),
            timeout=20,
        )
        response.raise_for_status()
        body = response.json()
    except Exception as exc:
        raise RuntimeError(f"Payment verification failed: {exc}") from exc
    if not body.get("status") or not body.get("data"):
        raise RuntimeError(body.get("message", "Unable to verify payment"))
    return body["data"]
