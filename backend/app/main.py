from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import text
from .database import engine

app = FastAPI(title="Bi-quicker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "bi-quicker-api"}

@app.get("/health/database")
def database_health() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}

STATIC_DIR = Path(__file__).parent / "static"

@app.get("/{path:path}")
def frontend(path: str):
    requested = STATIC_DIR / path
    if path and requested.is_file():
        return FileResponse(requested)
    return FileResponse(STATIC_DIR / "index.html")
