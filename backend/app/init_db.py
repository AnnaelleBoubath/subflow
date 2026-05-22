"""
Script d'initialisation — crée toutes les tables et insère des données de départ.
Lancer avec : python -m app.init_db
"""

from app.database import engine, SessionLocal
from app import models
from app.models import (
    Utilisateur, Tarif, Abonne, Paiement,
    RoleEnum, TypeAbonnementEnum, StatutAbonneEnum,
    StatutPaiementEnum, DureeEnum
)
from datetime import date
import hashlib


def hash_password(password: str) -> str:
    """Hash simple SHA-256 (remplacer par bcrypt en production)."""
    return hashlib.sha256(password.encode()).hexdigest()


def init_db():
    # 1. Créer toutes les tables
    print("Création des tables...")
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # 2. Utilisateurs par défaut
        if not db.query(Utilisateur).first():
            print("Insertion des utilisateurs...")
            db.add_all([
                Utilisateur(
                    nom="Admin", prenom="Super",
                    email="admin@subflow.cg",
                    mot_de_passe_hash=hash_password("admin123"),
                    role=RoleEnum.admin,
                ),
                Utilisateur(
                    nom="Moukala", prenom="Jean",
                    email="agent@subflow.cg",
                    mot_de_passe_hash=hash_password("agent123"),
                    role=RoleEnum.agent,
                ),
            ])
            db.commit()

        # 3. Grille tarifaire par défaut
        if not db.query(Tarif).first():
            print("Insertion des tarifs...")
            db.add_all([
                Tarif(type=TypeAbonnementEnum.basic,    duree=DureeEnum.un_mois,    prix=5000,  description="Accès limité aux services de base"),
                Tarif(type=TypeAbonnementEnum.standard, duree=DureeEnum.un_mois,    prix=10000, description="Accès complet aux services standards"),
                Tarif(type=TypeAbonnementEnum.premium,  duree=DureeEnum.un_mois,    prix=15000, description="Accès illimité + support prioritaire"),
                Tarif(type=TypeAbonnementEnum.basic,    duree=DureeEnum.trois_mois, prix=12000, description="Forfait trimestriel Basic"),
                Tarif(type=TypeAbonnementEnum.standard, duree=DureeEnum.trois_mois, prix=25000, description="Forfait trimestriel Standard"),
                Tarif(type=TypeAbonnementEnum.premium,  duree=DureeEnum.six_mois,   prix=40000, description="Forfait semestriel Premium"),
                Tarif(type=TypeAbonnementEnum.premium,  duree=DureeEnum.un_an,      prix=70000, description="Forfait annuel Premium — meilleure offre"),
            ])
            db.commit()

        # 4. Abonnés de démonstration
        if not db.query(Abonne).first():
            print("Insertion des abonnés de démo...")
            tarif_premium  = db.query(Tarif).filter_by(type=TypeAbonnementEnum.premium,  duree=DureeEnum.un_mois).first()
            tarif_standard = db.query(Tarif).filter_by(type=TypeAbonnementEnum.standard, duree=DureeEnum.un_mois).first()
            tarif_basic    = db.query(Tarif).filter_by(type=TypeAbonnementEnum.basic,    duree=DureeEnum.un_mois).first()

            abonnes = [
                Abonne(nom="Moukala",   prenom="Jean",   numero="+242 06 123 4567", adresse="Brazzaville, Poto-Poto",     statut=StatutAbonneEnum.actif,   tarif=tarif_premium,  date_inscription=date(2024, 1, 15)),
                Abonne(nom="Loemba",    prenom="Claire", numero="+242 05 987 6543", adresse="Brazzaville, Bacongo",       statut=StatutAbonneEnum.attente, tarif=tarif_standard, date_inscription=date(2024, 3,  2)),
                Abonne(nom="Ngoma",     prenom="Paul",   numero="+242 06 456 7890", adresse="Pointe-Noire, Centre-ville", statut=StatutAbonneEnum.expiré,  tarif=tarif_basic,    date_inscription=date(2023, 11,20)),
                Abonne(nom="Bissangou", prenom="Aline",  numero="+242 05 321 0987", adresse="Brazzaville, Moungali",      statut=StatutAbonneEnum.actif,   tarif=tarif_premium,  date_inscription=date(2024, 2, 10)),
                Abonne(nom="Mavoungou", prenom="Eric",   numero="+242 06 654 3210", adresse="Dolisie, Quartier Nord",     statut=StatutAbonneEnum.actif,   tarif=tarif_standard, date_inscription=date(2024, 4,  5)),
            ]
            db.add_all(abonnes)
            db.commit()

            # 5. Paiements de démonstration
            print("Insertion des paiements de démo...")
            agent = db.query(Utilisateur).filter_by(role=RoleEnum.agent).first()
            jean  = db.query(Abonne).filter_by(nom="Moukala").first()
            aline = db.query(Abonne).filter_by(nom="Bissangou").first()
            paul  = db.query(Abonne).filter_by(nom="Ngoma").first()

            db.add_all([
                Paiement(montant=15000, date=date(2024, 6, 4), statut=StatutPaiementEnum.payé,       abonne=jean,  enregistre_par_user=agent),
                Paiement(montant=25000, date=date(2024, 6, 4), statut=StatutPaiementEnum.payé,       abonne=aline, enregistre_par_user=agent),
                Paiement(montant=5000,  date=date(2024, 6, 3), statut=StatutPaiementEnum.en_attente, abonne=paul,  enregistre_par_user=agent),
            ])
            db.commit()

        print("✅ Base de données initialisée avec succès !")

    except Exception as e:
        db.rollback()
        print(f"❌ Erreur : {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
