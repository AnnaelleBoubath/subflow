from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./subflow.db")

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True, pool_recycle=300)
elif DATABASE_URL.startswith("mysql"):
    url = DATABASE_URL.replace("mysql://", "mysql+pymysql://")
    engine = create_engine(url, pool_pre_ping=True, pool_recycle=300)
else:
    url = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://")
    engine = create_engine(url, connect_args={"sslmode": "require"}, pool_pre_ping=True, pool_recycle=300)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
