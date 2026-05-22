"""
Routes SMS — /api/sms
Simulation d'envoi de notifications SMS aux abonnés
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import SMS, Abonne, TypeSMSEnum, StatutSMSEnum
from app.routers.auth import get_current_user
from app.models import Utilisateur

router = APIRouter(prefix="/api/sms", tags=["SMS"])

# Templates de messages prédéfinis
TEMPLATES = {
    "rappel_paiement": "Bonjour {prenom}, votre abonnement SubFlow arrive a echeance. Veuillez renouveler votre abonnement pour continuer a beneficier de nos services. Merci.",
    "confirmation":    "Bonjour {prenom}, votre paiement de {montant} FCFA a bien ete recu. Votre abonnement est actif. Merci de votre confiance.",
    "expiration":      "Bonjour {prenom}, votre abonnement SubFlow a expire. Contactez-nous pour le renouveler et profiter de nos services. Merci.",
}

class SMSCreate(BaseModel):
    abonne_id: int
    type: TypeSMSEnum = TypeSMSEnum.personnalise
    message: Optional[str] = None  # Si None, utilise le template

class SMSBulk(BaseModel):
    abonne_ids: List[int]
    type: TypeSMSEnum
    message: Optional[str] = None

class SMSOut(BaseModel):
    id: int
    numero: str
    message: str
    type: TypeSMSEnum
    statut: StatutSMSEnum
    abonne_id: Optional[int]
    cree_le: Optional[datetime]
    abonne: Optional[dict] = None

    class Config:
        from_attributes = True

def build_message(type: TypeSMSEnum, abonne: Abonne, custom: Optional[str] = None) -> str:
    if custom:
        return custom
    template = TEMPLATES.get(type.value, "Bonjour {prenom}, message de SubFlow.")
    return template.format(prenom=abonne.prenom, nom=abonne.nom)

@router.get("", response_model=List[dict])
def liste_sms(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    sms_list = db.query(SMS).order_by(SMS.cree_le.desc()).offset(skip).limit(limit).all()
    result = []
    for s in sms_list:
        result.append({
            "id": s.id,
            "numero": s.numero,
            "message": s.message,
            "type": s.type,
            "statut": s.statut,
            "abonne_id": s.abonne_id,
            "abonne_nom": f"{s.abonne.prenom} {s.abonne.nom}" if s.abonne else None,
            "cree_le": s.cree_le.isoformat() if s.cree_le else None,
        })
    return result

@router.post("/envoyer", status_code=201)
def envoyer_sms(
    data: SMSCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    abonne = db.query(Abonne).filter(Abonne.id == data.abonne_id).first()
    if not abonne:
        raise HTTPException(status_code=404, detail="Abonne introuvable")

    message = build_message(data.type, abonne, data.message)

    sms = SMS(
        numero=abonne.numero,
        message=message,
        type=data.type,
        statut=StatutSMSEnum.simule,
        abonne_id=abonne.id,
        envoye_par=current_user.id,
    )
    db.add(sms)
    db.commit()
    db.refresh(sms)

    return {
        "id": sms.id,
        "numero": sms.numero,
        "message": sms.message,
        "statut": sms.statut,
        "simule": True,
        "info": "SMS simule — brancher Twilio ou Orange SMS pour l'envoi reel",
    }

@router.post("/envoyer-bulk", status_code=201)
def envoyer_bulk(
    data: SMSBulk,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    resultats = []
    for abonne_id in data.abonne_ids:
        abonne = db.query(Abonne).filter(Abonne.id == abonne_id).first()
        if not abonne:
            continue
        message = build_message(data.type, abonne, data.message)
        sms = SMS(
            numero=abonne.numero,
            message=message,
            type=data.type,
            statut=StatutSMSEnum.simule,
            abonne_id=abonne.id,
            envoye_par=current_user.id,
        )
        db.add(sms)
        resultats.append({"abonne": f"{abonne.prenom} {abonne.nom}", "numero": abonne.numero})

    db.commit()
    return {
        "envoyes": len(resultats),
        "simule": True,
        "destinataires": resultats,
    }

@router.post("/rappels-expiration", status_code=201)
def envoyer_rappels_expiration(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    from app.models import StatutAbonneEnum
    abonnes_expires = db.query(Abonne).filter(
        Abonne.statut == StatutAbonneEnum.expiré
    ).all()

    count = 0
    for abonne in abonnes_expires:
        message = build_message(TypeSMSEnum.expiration, abonne)
        sms = SMS(
            numero=abonne.numero,
            message=message,
            type=TypeSMSEnum.expiration,
            statut=StatutSMSEnum.simule,
            abonne_id=abonne.id,
            envoye_par=current_user.id,
        )
        db.add(sms)
        count += 1

    db.commit()
    return {
        "envoyes": count,
        "simule": True,
        "message": f"{count} rappels envoyes aux abonnes expires",
    }

@router.get("/stats")
def stats_sms(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    total    = db.query(SMS).count()
    simules  = db.query(SMS).filter(SMS.statut == StatutSMSEnum.simule).count()
    envoyes  = db.query(SMS).filter(SMS.statut == StatutSMSEnum.envoye).count()
    echecs   = db.query(SMS).filter(SMS.statut == StatutSMSEnum.echec).count()
    return {"total": total, "simules": simules, "envoyes": envoyes, "echecs": echecs}
