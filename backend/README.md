# SubFlow — Backend (Python + FastAPI + PostgreSQL)

## Stack technique
- **FastAPI** — framework API REST
- **SQLAlchemy 2.0** — ORM
- **PostgreSQL** — base de données
- **Token Bearer** — authentification

## Installation

```bash
# 1. Créer et activer l'environnement virtuel
python -m venv venv
source venv/Scripts/activate   # Windows Git Bash
source venv/bin/activate       # Linux/Mac

# 2. Installer les dépendances
pip install -r requirements.txt
pip install psycopg2-binary

# 3. Configurer .env
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL

# 4. Initialiser la base de données
python -m app.init_db

# 5. Lancer le serveur
uvicorn app.main:app --reload
```

## Variables d'environnement (.env)

```
DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:VOTRE_PORT/subflow
SECRET_KEY=votre-cle-secrete
SESSION_MAX_AGE=3600
```

## Comptes par défaut

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@subflow.cg | admin123 | Administrateur |
| agent@subflow.cg | agent123 | Agent |

## Routes API disponibles

| Module | Routes |
|--------|--------|
| Auth | POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me |
| Abonnés | GET/POST /api/abonnes, GET/PUT/DELETE /api/abonnes/{id} |
| Paiements | GET/POST /api/paiements, GET/PUT/DELETE /api/paiements/{id} |
| Tarifs | GET/POST /api/tarifs, GET/PUT/DELETE /api/tarifs/{id} |
| SMS | GET /api/sms, POST /api/sms/envoyer, POST /api/sms/envoyer-bulk |
| Dashboard | GET /api/dashboard/stats, /stats-mensuelles, /stats-abonnes |
| Utilisateurs | GET/POST /api/utilisateurs, PUT/DELETE /api/utilisateurs/{id} |

Documentation interactive : **http://localhost:8000/docs**
