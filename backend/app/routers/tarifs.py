"""
Routes Tarifs — /api/tarifs
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Tarif, TypeAbonnementEnum, DureeEnum
from app.schemas import TarifCreate, TarifUpdate, TarifOut
from app.routers.auth import get_current_user
from app.models import Utilisateur

router = APIRouter(prefix="/api/tarifs", tags=["Tarifs"])


@router.get("", response_model=List[TarifOut])
def liste_tarifs(
    type: Optional[TypeAbonnementEnum] = Query(None),
    duree: Optional[DureeEnum] = Query(None),
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    query = db.query(Tarif)
    if type:
        query = query.filter(Tarif.type == type)
    if duree:
        query = query.filter(Tarif.duree == duree)
    return query.order_by(Tarif.type, Tarif.duree).all()


@router.get("/{tarif_id}", response_model=TarifOut)
def get_tarif(
    tarif_id: int,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    tarif = db.query(Tarif).filter(Tarif.id == tarif_id).first()
    if not tarif:
        raise HTTPException(status_code=404, detail="Tarif introuvable")
    return tarif


@router.post("", response_model=TarifOut, status_code=201)
def creer_tarif(
    data: TarifCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Réservé à l'administrateur")
    tarif = Tarif(**data.model_dump())
    db.add(tarif)
    db.commit()
    db.refresh(tarif)
    return tarif


@router.put("/{tarif_id}", response_model=TarifOut)
def modifier_tarif(
    tarif_id: int,
    data: TarifUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Réservé à l'administrateur")
    tarif = db.query(Tarif).filter(Tarif.id == tarif_id).first()
    if not tarif:
        raise HTTPException(status_code=404, detail="Tarif introuvable")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(tarif, key, value)
    db.commit()
    db.refresh(tarif)
    return tarif


@router.delete("/{tarif_id}", status_code=204)
def supprimer_tarif(
    tarif_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Réservé à l'administrateur")
    tarif = db.query(Tarif).filter(Tarif.id == tarif_id).first()
    if not tarif:
        raise HTTPException(status_code=404, detail="Tarif introuvable")
    db.delete(tarif)
    db.commit()
