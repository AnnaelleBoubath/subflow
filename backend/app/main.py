from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.routers import auth, abonnes, paiements, tarifs, dashboard, utilisateurs, sms
from app.database import engine
from app import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SubFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(abonnes.router)
app.include_router(paiements.router)
app.include_router(tarifs.router)
app.include_router(dashboard.router)
app.include_router(utilisateurs.router)
app.include_router(sms.router)


@app.get("/")
def root():
    return {"app": "SubFlow API", "version": "1.0.0"}
