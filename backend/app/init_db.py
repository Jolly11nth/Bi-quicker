from .commerce import seed_vendors
from .database import engine
from .models import Base
from sqlalchemy.orm import Session


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        seed_vendors(db)
    print("Bi-quicker database tables and seed catalog initialized")
