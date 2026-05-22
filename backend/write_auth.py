with open("app/routers/auth.py", "w", encoding="utf-8") as f:
    f.write('''from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from typing import Optional
import hashlib, secrets
from app.database import get_db, Base, engine
from app.models import Utilisateur
from app.schemas import LoginSchema, UtilisateurOut

class Token(Base):
    __tablename__ = "tokens"
    id      = Column(Integer, primary_key=True)
    token   = Column(String(64), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("utilisateurs.id"))
    cree_le = Column(DateTime(timezone=True), server_default=func.now())

Base.metadata.create_all(bind=engine)
router = APIRouter(prefix="/api/auth", tags=["Auth"])

def hash_password(p): return hashlib.sha256(p.encode()).hexdigest()

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifie")
    tok = authorization.split(" ")[1]
    t = db.query(Token).filter(Token.token == tok).first()
    if not t:
        raise HTTPException(status_code=401, detail="Token invalide")
    user = db.query(Utilisateur).filter(Utilisateur.id == t.user_id, Utilisateur.est_actif == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user

@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(Utilisateur).filter(Utilisateur.email == data.email).first()
    if not user or user.mot_de_passe_hash != hash_password(data.mot_de_passe):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    tok = secrets.token_hex(32)
    db.add(Token(token=tok, user_id=user.id))
    db.commit()
    return {"token": tok, "user": UtilisateurOut.model_validate(user)}

@router.post("/logout")
def logout(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if authorization and authorization.startswith("Bearer "):
        tok = authorization.split(" ")[1]
        db.query(Token).filter(Token.token == tok).delete()
        db.commit()
    return {"message": "Deconnexion reussie"}

@router.get("/me", response_model=UtilisateurOut)
def me(current_user: Utilisateur = Depends(get_current_user)):
    return current_user
''')
print("OK")
