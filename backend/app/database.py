from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

# SQLite par défaut — aucune installation requise, le fichier subflow.db
# sera créé automatiquement dans le dossier du projet.
# Pour passer à PostgreSQL plus tard, définir la variable d'environnement :
# DATABASE_URL=postgresql://postgres:password@localhost:5432/subflow

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./subflow.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dépendance FastAPI — injectée dans chaque route
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
