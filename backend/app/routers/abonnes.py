"""
Routes Abonnés — /api/abonnes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Abonne, StatutAbonneEnum
from app.schemas import AbonneCreate, AbonneUpdate, AbonneOut
from app.routers.auth import get_current_user
from app.models import Utilisateur

router = APIRouter(prefix="/api/abonnes", tags=["Abonnés"])


@router.get("", response_model=List[AbonneOut])
def liste_abonnes(
    search: Optional[str] = Query(None),
    statut: Optional[StatutAbonneEnum] = Query(None),
    tarif_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    query = db.query(Abonne)
    if search:
        q = f"%{search}%"
        query = query.filter(
            Abonne.nom.ilike(q) |
            Abonne.prenom.ilike(q) |
            Abonne.numero.ilike(q) |
            Abonne.adresse.ilike(q)
        )
    if statut:
        query = query.filter(Abonne.statut == statut)
    if tarif_id:
        query = query.filter(Abonne.tarif_id == tarif_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{abonne_id}", response_model=AbonneOut)
def get_abonne(
    abonne_id: int,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    abonne = db.query(Abonne).filter(Abonne.id == abonne_id).first()
    if not abonne:
        raise HTTPException(status_code=404, detail="Abonné introuvable")
    return abonne


@router.post("", response_model=AbonneOut, status_code=201)
def creer_abonne(
    data: AbonneCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    # Vérifier numéro unique
    existant = db.query(Abonne).filter(Abonne.numero == data.numero).first()
    if existant:
        raise HTTPException(status_code=400, detail="Ce numéro est déjà utilisé")
    abonne = Abonne(**data.model_dump(), cree_par=current_user.id)
    db.add(abonne)
    db.commit()
    db.refresh(abonne)
    return abonne


@router.put("/{abonne_id}", response_model=AbonneOut)
def modifier_abonne(
    abonne_id: int,
    data: AbonneUpdate,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    abonne = db.query(Abonne).filter(Abonne.id == abonne_id).first()
    if not abonne:
        raise HTTPException(status_code=404, detail="Abonné introuvable")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(abonne, key, value)
    db.commit()
    db.refresh(abonne)
    return abonne


@router.delete("/{abonne_id}", status_code=204)
def supprimer_abonne(
    abonne_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Réservé à l'administrateur")
    abonne = db.query(Abonne).filter(Abonne.id == abonne_id).first()
    if not abonne:
        raise HTTPException(status_code=404, detail="Abonné introuvable")
    db.delete(abonne)
    db.commit()
