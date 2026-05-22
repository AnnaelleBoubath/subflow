from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, timedelta

from app.database import get_db
from app.models import Abonne, Paiement, SMS, StatutAbonneEnum, StatutPaiementEnum, TypeAbonnementEnum
from app.routers.auth import get_current_user
from app.models import Utilisateur

router = APIRouter(prefix="/api/stats", tags=["Statistiques"])


@router.get("/abonnes-par-type")
def abonnes_par_type(db: Session = Depends(get_db), _: Utilisateur = Depends(get_current_user)):
    resultats = db.query(
        Abonne.tarif_id,
        func.count(Abonne.id).label("total")
    ).group_by(Abonne.tarif_id).all()

    from app.models import Tarif
    data = []
    for r in db.query(Tarif.type, func.count(Abonne.id)).join(Abonne, Abonne.tarif_id == Tarif.id, isouter=True).group_by(Tarif.type).all():
        data.append({"type": r[0], "total": r[1]})
    return data


@router.get("/abonnes-par-statut")
def abonnes_par_statut(db: Session = Depends(get_db), _: Utilisateur = Depends(get_current_user)):
    resultats = db.query(
        Abonne.statut,
        func.count(Abonne.id).label("total")
    ).group_by(Abonne.statut).all()
    return [{"statut": r.statut, "total": r.total} for r in resultats]


@router.get("/revenus-par-mois")
def revenus_par_mois(db: Session = Depends(get_db), _: Utilisateur = Depends(get_current_user)):
    today = date.today()
    data = []
    mois_labels = ["Jan","Fev","Mar","Avr","Mai","Jun","Jul","Aou","Sep","Oct","Nov","Dec"]
    for i in range(6):
        mois = (today.month - 5 + i - 1) % 12 + 1
        annee = today.year if mois <= today.month else today.year - 1
        total = db.query(func.coalesce(func.sum(Paiement.montant), 0)).filter(
            Paiement.statut == StatutPaiementEnum.payé,
            extract('month', Paiement.date) == mois,
            extract('year',  Paiement.date) == annee,
        ).scalar()
        data.append({"mois": mois_labels[mois - 1], "revenus": float(total)})
    return data


@router.get("/paiements-par-statut")
def paiements_par_statut(db: Session = Depends(get_db), _: Utilisateur = Depends(get_current_user)):
    resultats = db.query(
        Paiement.statut,
        func.count(Paiement.id).label("total"),
        func.coalesce(func.sum(Paiement.montant), 0).label("montant")
    ).group_by(Paiement.statut).all()
    return [{"statut": r.statut, "total": r.total, "montant": float(r.montant)} for r in resultats]


@router.get("/nouveaux-abonnes-par-mois")
def nouveaux_abonnes(db: Session = Depends(get_db), _: Utilisateur = Depends(get_current_user)):
    today = date.today()
    data = []
    mois_labels = ["Jan","Fev","Mar","Avr","Mai","Jun","Jul","Aou","Sep","Oct","Nov","Dec"]
    for i in range(6):
        mois = (today.month - 5 + i - 1) % 12 + 1
        annee = today.year if mois <= today.month else today.year - 1
        total = db.query(func.count(Abonne.id)).filter(
            extract('month', Abonne.date_inscription) == mois,
            extract('year',  Abonne.date_inscription) == annee,
        ).scalar()
        data.append({"mois": mois_labels[mois - 1], "abonnes": total})
    return data
