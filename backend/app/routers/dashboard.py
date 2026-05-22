"""
Routes Dashboard — /api/dashboard
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date

from app.database import get_db
from app.models import Abonne, Paiement, StatutAbonneEnum, StatutPaiementEnum
from app.schemas import DashboardStats
from app.routers.auth import get_current_user
from app.models import Utilisateur

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    today = date.today()

    total_abonnes  = db.query(func.count(Abonne.id)).scalar()
    abonnes_actifs = db.query(func.count(Abonne.id)).filter(Abonne.statut == StatutAbonneEnum.actif).scalar()
    abonnes_expires= db.query(func.count(Abonne.id)).filter(Abonne.statut == StatutAbonneEnum.expiré).scalar()

    revenus_mois = db.query(func.coalesce(func.sum(Paiement.montant), 0)).filter(
        Paiement.statut == StatutPaiementEnum.payé,
        extract('month', Paiement.date) == today.month,
        extract('year',  Paiement.date) == today.year,
    ).scalar()

    paiements_attente  = db.query(func.count(Paiement.id)).filter(Paiement.statut == StatutPaiementEnum.en_attente).scalar()
    paiements_annules  = db.query(func.count(Paiement.id)).filter(Paiement.statut == StatutPaiementEnum.annulé).scalar()

    return DashboardStats(
        total_abonnes=total_abonnes,
        abonnes_actifs=abonnes_actifs,
        abonnes_expires=abonnes_expires,
        revenus_mois=float(revenus_mois),
        paiements_en_attente=paiements_attente,
        paiements_annules=paiements_annules,
    )


@router.get("/abonnes-recents")
def abonnes_recents(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    abonnes = db.query(Abonne).order_by(Abonne.cree_le.desc()).limit(5).all()
    return abonnes


@router.get("/paiements-recents")
def paiements_recents(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    paiements = db.query(Paiement).order_by(Paiement.date.desc()).limit(5).all()
    return paiements


@router.get("/evolution-paiements")
def evolution_paiements(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    """Revenus des 6 derniers mois"""
    from sqlalchemy import extract
    from datetime import date
    import calendar

    today = date.today()
    result = []

    for i in range(5, -1, -1):
        month = (today.month - i - 1) % 12 + 1
        year  = today.year - ((today.month - i - 1) // 12)
        total = db.query(func.coalesce(func.sum(Paiement.montant), 0)).filter(
            Paiement.statut == StatutPaiementEnum.payé,
            extract('month', Paiement.date) == month,
            extract('year',  Paiement.date) == year,
        ).scalar()
        result.append({
            "mois": calendar.month_abbr[month],
            "annee": year,
            "revenus": float(total),
        })
    return result


@router.get("/repartition-abonnes")
def repartition_abonnes(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    """Répartition des abonnés par type de tarif"""
    from app.models import Tarif, TypeAbonnementEnum
    result = []
    for t in ['Basic', 'Standard', 'Premium']:
        count = db.query(func.count(Abonne.id)).join(Tarif).filter(
            Tarif.type == t
        ).scalar()
        result.append({"type": t, "count": count})
    # Abonnés sans tarif
    sans_tarif = db.query(func.count(Abonne.id)).filter(Abonne.tarif_id == None).scalar()
    if sans_tarif > 0:
        result.append({"type": "Sans tarif", "count": sans_tarif})
    return result


@router.get("/statuts-abonnes")
def statuts_abonnes(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    """Répartition des abonnés par statut"""
    from app.models import StatutAbonneEnum
    result = []
    for s, label in [('actif', 'Actifs'), ('expiré', 'Expirés'), ('attente', 'En attente')]:
        count = db.query(func.count(Abonne.id)).filter(Abonne.statut == s).scalar()
        result.append({"statut": label, "count": count})
    return result


@router.get("/evolution-abonnes")
def evolution_abonnes(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    """Nouveaux abonnés des 6 derniers mois"""
    from sqlalchemy import extract
    from datetime import date
    import calendar

    today = date.today()
    result = []
    for i in range(5, -1, -1):
        month = (today.month - i - 1) % 12 + 1
        year  = today.year - ((today.month - i - 1) // 12)
        count = db.query(func.count(Abonne.id)).filter(
            extract('month', Abonne.date_inscription) == month,
            extract('year',  Abonne.date_inscription) == year,
        ).scalar()
        result.append({
            "mois": calendar.month_abbr[month],
            "annee": year,
            "abonnes": count,
        })
    return result


@router.get("/stats-mensuelles")
def stats_mensuelles(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    """Revenus et nombre de paiements par mois sur les 6 derniers mois"""
    from sqlalchemy import extract, func
    from datetime import date
    import calendar

    today = date.today()
    result = []

    for i in range(5, -1, -1):
        month = (today.month - i - 1) % 12 + 1
        year  = today.year - ((today.month - i - 1) // 12)

        revenus = db.query(func.coalesce(func.sum(Paiement.montant), 0)).filter(
            Paiement.statut == StatutPaiementEnum.payé,
            extract('month', Paiement.date) == month,
            extract('year',  Paiement.date) == year,
        ).scalar()

        nb_paiements = db.query(func.count(Paiement.id)).filter(
            extract('month', Paiement.date) == month,
            extract('year',  Paiement.date) == year,
        ).scalar()

        result.append({
            "mois": calendar.month_abbr[month],
            "annee": year,
            "revenus": float(revenus),
            "paiements": nb_paiements,
        })

    return result


@router.get("/stats-abonnes")
def stats_abonnes(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    """Repartition des abonnes par statut et par type de tarif"""
    from sqlalchemy import func
    from app.models import Abonne, Tarif, TypeAbonnementEnum

    par_statut = db.query(Abonne.statut, func.count(Abonne.id)).group_by(Abonne.statut).all()
    par_type   = db.query(Tarif.type, func.count(Abonne.id)).join(Abonne, Abonne.tarif_id == Tarif.id, isouter=True).group_by(Tarif.type).all()

    return {
        "par_statut": [{"statut": s, "total": c} for s, c in par_statut],
        "par_type":   [{"type": t, "total": c}   for t, c in par_type],
    }


@router.get("/stats-paiements")
def stats_paiements(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(get_current_user),
):
    """Repartition des paiements par statut"""
    from sqlalchemy import func

    par_statut = db.query(Paiement.statut, func.count(Paiement.id), func.coalesce(func.sum(Paiement.montant), 0)).group_by(Paiement.statut).all()

    return [{"statut": s, "total": c, "montant": float(m)} for s, c, m in par_statut]
