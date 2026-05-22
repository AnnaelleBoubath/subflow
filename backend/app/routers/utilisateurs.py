from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import hashlib

from app.database import get_db
from app.models import Utilisateur, RoleEnum
from app.schemas import UtilisateurOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/utilisateurs", tags=["Utilisateurs"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class UtilisateurCreate(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    mot_de_passe: str
    role: RoleEnum = RoleEnum.agent

class UtilisateurUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[EmailStr] = None
    mot_de_passe: Optional[str] = None
    role: Optional[RoleEnum] = None
    est_actif: Optional[bool] = None

def admin_only(current_user: Utilisateur = Depends(get_current_user)):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Reserve a l'administrateur")
    return current_user

@router.get("", response_model=List[UtilisateurOut])
def liste_utilisateurs(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(admin_only),
):
    return db.query(Utilisateur).all()

@router.post("", response_model=UtilisateurOut, status_code=201)
def creer_utilisateur(
    data: UtilisateurCreate,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(admin_only),
):
    existant = db.query(Utilisateur).filter(Utilisateur.email == data.email).first()
    if existant:
        raise HTTPException(status_code=400, detail="Email deja utilise")
    user = Utilisateur(
        nom=data.nom,
        prenom=data.prenom,
        email=data.email,
        mot_de_passe_hash=hash_password(data.mot_de_passe),
        role=data.role,
        est_actif=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", response_model=UtilisateurOut)
def modifier_utilisateur(
    user_id: int,
    data: UtilisateurUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(admin_only),
):
    user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if data.nom        is not None: user.nom       = data.nom
    if data.prenom     is not None: user.prenom    = data.prenom
    if data.email      is not None: user.email     = data.email
    if data.role       is not None: user.role      = data.role
    if data.est_actif  is not None: user.est_actif = data.est_actif
    if data.mot_de_passe:           user.mot_de_passe_hash = hash_password(data.mot_de_passe)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=204)
def supprimer_utilisateur(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(admin_only),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Impossible de supprimer votre propre compte")
    user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    db.delete(user)
    db.commit()
