from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./subflow.db")

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
elif DATABASE_URL.startswith("postgresql"):
    url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://").replace("postgresql+asyncpg+asyncpg", "postgresql+asyncpg")
    engine = create_engine(url.replace("+asyncpg", ""), connect_args={"sslmode": "require"})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
