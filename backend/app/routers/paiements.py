"""
Routes Paiements — /api/paiements
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import Paiement, Abonne, StatutPaiementEnum
from app.schemas import PaiementCreate, PaiementUpdate, PaiementOut
from app.routers.auth import get_current_user
from app.models import Utilisateur

router = APIRouter(prefix="/api/paiements", tags=["Paiements"])


@router.get("", response_model=List[PaiementOut])
def liste_paiements(
    search: Optional[str] = Query(None),
    statut: Optional[StatutPaiementEnum] = Query(None),
    abonne_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    query = db.query(Paiement)
    if search:
        q = f"%{search}%"
        query = query.join(Abonne).filter(
            Abonne.nom.ilike(q) | Abonne.prenom.ilike(q)
        )
    if statut:
        query = query.filter(Paiement.statut == statut)
    if abonne_id:
        query = query.filter(Paiement.abonne_id == abonne_id)
    return query.order_by(Paiement.date.desc()).offset(skip).limit(limit).all()


@router.get("/{paiement_id}", response_model=PaiementOut)
def get_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    paiement = db.query(Paiement).filter(Paiement.id == paiement_id).first()
    if not paiement:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    return paiement


@router.post("", response_model=PaiementOut, status_code=201)
def enregistrer_paiement(
    data: PaiementCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    abonne = db.query(Abonne).filter(Abonne.id == data.abonne_id).first()
    if not abonne:
        raise HTTPException(status_code=404, detail="Abonné introuvable")
    paiement = Paiement(**data.model_dump(), enregistre_par=current_user.id)
    db.add(paiement)
    db.commit()
    db.refresh(paiement)
    return paiement


@router.put("/{paiement_id}", response_model=PaiementOut)
def modifier_paiement(
    paiement_id: int,
    data: PaiementUpdate,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    paiement = db.query(Paiement).filter(Paiement.id == paiement_id).first()
    if not paiement:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(paiement, key, value)
    db.commit()
    db.refresh(paiement)
    return paiement


@router.delete("/{paiement_id}", status_code=204)
def supprimer_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Réservé à l'administrateur")
    paiement = db.query(Paiement).filter(Paiement.id == paiement_id).first()
    if not paiement:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    db.delete(paiement)
    db.commit()
