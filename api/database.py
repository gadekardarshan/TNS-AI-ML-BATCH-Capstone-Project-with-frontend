"""
database.py — SQLite database ORM models and initialization.
Stores Doctor user credentials and Patient Assessment audit trail records.
"""
import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Float
from sqlalchemy.orm import declarative_base, sessionmaker
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

DB_PATH = os.environ.get(
    "DB_PATH",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "hospital_dashboard.db"),
)

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="Cardiologist")
    created_at = Column(DateTime, default=datetime.utcnow)


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, index=True)
    patient_ref = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=True, default="John Doe")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    input_summary = Column(Text, nullable=False)  # JSON string
    model_results = Column(Text, nullable=False)  # JSON string
    consensus = Column(Text, nullable=False)      # JSON string
    doctor_notes = Column(Text, nullable=True, default="")
    created_by_email = Column(String, nullable=True)


from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Float, text

def init_db():
    """Initializes tables and seeds default doctor account if not present."""
    Base.metadata.create_all(bind=engine)

    # Migrate sqlite table if patient_name column is missing
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE assessments ADD COLUMN patient_name VARCHAR DEFAULT 'John Doe'"))
            conn.commit()
            print("[DB] Migrated assessments table with patient_name column.")
        except Exception:
            pass

    db = SessionLocal()
    try:
        default_email = "doctor@hospital.org"
        existing = db.query(User).filter(User.email == default_email).first()
        if not existing:
            default_user = User(
                email=default_email,
                hashed_password=pwd_context.hash("Doctor123!"),
                full_name="Dr. Sarah Jenkins, MD",
                role="Senior Cardiologist",
            )
            db.add(default_user)
            db.commit()
            print(f"[DB] Initialized default doctor account: {default_email}")
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
