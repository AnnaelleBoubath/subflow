"""
Modèles SQLAlchemy — SubFlow
Tables : utilisateurs, abonnes, tarifs, paiements
"""

from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime,
    Enum, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


# ── Enums ─────────────────────────────────────────────────────────────────────

class RoleEnum(str, enum.Enum):
    admin  = "admin"
    agent  = "agent"

class TypeAbonnementEnum(str, enum.Enum):
    basic    = "Basic"
    standard = "Standard"
    premium  = "Premium"

class StatutAbonneEnum(str, enum.Enum):
    actif   = "actif"
    expiré  = "expiré"
    attente = "attente"

class StatutPaiementEnum(str, enum.Enum):
    payé       = "payé"
    en_attente = "en attente"
    annulé     = "annulé"

class DureeEnum(int, enum.Enum):
    un_mois    = 1
    trois_mois = 3
    six_mois   = 6
    un_an      = 12


# ── Table : utilisateurs ───────────────────────────────────────────────────────

class Utilisateur(Base):
    """
    Comptes de connexion (admins et agents).
    """
    __tablename__ = "utilisateurs"

    id         = Column(Integer, primary_key=True, index=True)
    nom        = Column(String(100), nullable=False)
    prenom     = Column(String(100), nullable=False)
    email      = Column(String(150), unique=True, nullable=False, index=True)
    mot_de_passe_hash = Column(String(255), nullable=False)
    role       = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.agent)
    est_actif  = Column(Boolean, default=True, nullable=False)

    cree_le    = Column(DateTime(timezone=True), server_default=func.now())
    modifie_le = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    paiements_enregistres = relationship("Paiement", back_populates="enregistre_par_user")

    def __repr__(self):
        return f"<Utilisateur {self.email} [{self.role}]>"


# ── Table : tarifs ─────────────────────────────────────────────────────────────

class Tarif(Base):
    """
    Grille tarifaire : chaque ligne = un type × une durée × un prix.
    """
    __tablename__ = "tarifs"

    id          = Column(Integer, primary_key=True, index=True)
    type        = Column(Enum(TypeAbonnementEnum), nullable=False)
    duree       = Column(Enum(DureeEnum), nullable=False)          # en mois
    prix        = Column(Float, nullable=False)                     # en FCFA
    description = Column(Text, nullable=True)

    cree_le    = Column(DateTime(timezone=True), server_default=func.now())
    modifie_le = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    abonnes    = relationship("Abonne", back_populates="tarif")

    def __repr__(self):
        return f"<Tarif {self.type} {self.duree}mois — {self.prix}F>"


# ── Table : abonnes ────────────────────────────────────────────────────────────

class Abonne(Base):
    """
    Informations personnelles de chaque abonné.
    """
    __tablename__ = "abonnes"

    id        = Column(Integer, primary_key=True, index=True)
    nom       = Column(String(100), nullable=False, index=True)
    prenom    = Column(String(100), nullable=False)
    numero    = Column(String(20),  nullable=False, unique=True, index=True)
    adresse   = Column(String(255), nullable=True)
    statut    = Column(Enum(StatutAbonneEnum), nullable=False, default=StatutAbonneEnum.attente)

    # Clé étrangère vers la grille tarifaire
    tarif_id  = Column(Integer, ForeignKey("tarifs.id"), nullable=True)
    tarif     = relationship("Tarif", back_populates="abonnes")

    date_inscription  = Column(Date, default=date.today, nullable=False)
    date_expiration   = Column(Date, nullable=True)

    cree_par      = Column(Integer, ForeignKey("utilisateurs.id"), nullable=True)
    cree_par_user = relationship("Utilisateur", foreign_keys=[cree_par])
    cree_le    = Column(DateTime(timezone=True), server_default=func.now())
    modifie_le = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    paiements  = relationship("Paiement", back_populates="abonne", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Abonne {self.prenom} {self.nom} [{self.statut}]>"


# ── Table : paiements ──────────────────────────────────────────────────────────

class Paiement(Base):
    """
    Historique de tous les paiements d'abonnements.
    """
    __tablename__ = "paiements"

    id      = Column(Integer, primary_key=True, index=True)
    montant = Column(Float, nullable=False)
    date    = Column(Date, default=date.today, nullable=False)
    statut  = Column(Enum(StatutPaiementEnum), nullable=False, default=StatutPaiementEnum.en_attente)
    note    = Column(Text, nullable=True)

    # Clé étrangère vers abonné
    abonne_id = Column(Integer, ForeignKey("abonnes.id"), nullable=False)
    abonne    = relationship("Abonne", back_populates="paiements")

    # Clé étrangère vers l'agent qui a enregistré
    enregistre_par    = Column(Integer, ForeignKey("utilisateurs.id"), nullable=True)
    enregistre_par_user = relationship("Utilisateur", back_populates="paiements_enregistres")

    cree_le    = Column(DateTime(timezone=True), server_default=func.now())
    modifie_le = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Paiement {self.montant}F — {self.statut} [{self.date}]>"


# ── Table : notifications SMS ─────────────────────────────────────────────────

class StatutSMSEnum(str, enum.Enum):
    envoye   = "envoye"
    simule   = "simule"
    echec    = "echec"

class TypeSMSEnum(str, enum.Enum):
    rappel_paiement  = "rappel_paiement"
    confirmation     = "confirmation"
    expiration       = "expiration"
    personnalise     = "personnalise"

class SMS(Base):
    """
    Historique des notifications SMS envoyees aux abonnes.
    """
    __tablename__ = "sms"

    id         = Column(Integer, primary_key=True, index=True)
    numero     = Column(String(20), nullable=False)
    message    = Column(Text, nullable=False)
    type       = Column(Enum(TypeSMSEnum), nullable=False, default=TypeSMSEnum.personnalise)
    statut     = Column(Enum(StatutSMSEnum), nullable=False, default=StatutSMSEnum.simule)

    abonne_id  = Column(Integer, ForeignKey("abonnes.id"), nullable=True)
    abonne     = relationship("Abonne", backref="sms")

    envoye_par = Column(Integer, ForeignKey("utilisateurs.id"), nullable=True)
    envoye_par_user = relationship("Utilisateur", backref="sms_envoyes")

    cree_le    = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<SMS {self.numero} [{self.statut}]>"
