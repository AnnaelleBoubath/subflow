"""
Schémas Pydantic — validation des données entrantes/sortantes
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from app.models import RoleEnum, TypeAbonnementEnum, StatutAbonneEnum, StatutPaiementEnum, DureeEnum


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginSchema(BaseModel):
    email: EmailStr
    mot_de_passe: str

class UtilisateurOut(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: RoleEnum
    est_actif: bool

    class Config:
        from_attributes = True


# ── Tarifs ────────────────────────────────────────────────────────────────────

class TarifCreate(BaseModel):
    type: TypeAbonnementEnum
    duree: DureeEnum
    prix: float
    description: Optional[str] = None

class TarifUpdate(BaseModel):
    type: Optional[TypeAbonnementEnum] = None
    duree: Optional[DureeEnum] = None
    prix: Optional[float] = None
    description: Optional[str] = None

class TarifOut(BaseModel):
    id: int
    type: TypeAbonnementEnum
    duree: DureeEnum
    prix: float
    description: Optional[str]
    cree_le: Optional[datetime]

    class Config:
        from_attributes = True


# ── Abonnés ───────────────────────────────────────────────────────────────────

class AbonneCreate(BaseModel):
    nom: str
    prenom: str
    numero: str
    adresse: Optional[str] = None
    statut: StatutAbonneEnum = StatutAbonneEnum.attente
    tarif_id: Optional[int] = None
    date_expiration: Optional[date] = None

class AbonneUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    numero: Optional[str] = None
    adresse: Optional[str] = None
    statut: Optional[StatutAbonneEnum] = None
    tarif_id: Optional[int] = None
    date_expiration: Optional[date] = None

class AbonneOut(BaseModel):
    id: int
    nom: str
    prenom: str
    numero: str
    adresse: Optional[str]
    statut: StatutAbonneEnum
    tarif_id: Optional[int]
    tarif: Optional[TarifOut]
    date_inscription: date
    date_expiration: Optional[date]
    cree_le: Optional[datetime]

    class Config:
        from_attributes = True


# ── Paiements ─────────────────────────────────────────────────────────────────

class PaiementCreate(BaseModel):
    montant: float
    date: date
    statut: StatutPaiementEnum = StatutPaiementEnum.en_attente
    note: Optional[str] = None
    abonne_id: int

class PaiementUpdate(BaseModel):
    montant: Optional[float] = None
    date: Optional[date] = None
    statut: Optional[StatutPaiementEnum] = None
    note: Optional[str] = None

class PaiementOut(BaseModel):
    id: int
    montant: float
    date: date
    statut: StatutPaiementEnum
    note: Optional[str]
    abonne_id: int
    abonne: Optional[AbonneOut]
    enregistre_par: Optional[int]
    cree_le: Optional[datetime]

    class Config:
        from_attributes = True


# ── Stats dashboard ───────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_abonnes: int
    abonnes_actifs: int
    abonnes_expires: int
    revenus_mois: float
    paiements_en_attente: int
    paiements_annules: int
