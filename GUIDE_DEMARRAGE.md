# SubFlow — Guide de démarrage rapide

## Prérequis
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

---

## Étape 1 — Backend

```bash
cd subflow-backend

# Activer l'environnement virtuel
python -m venv venv
source venv/Scripts/activate      # Windows
# source venv/bin/activate        # Linux/Mac

# Installer les dépendances
pip install -r requirements.txt
pip install psycopg2-binary

# Configurer la base de données
cp .env.example .env
# Éditer .env : mettre votre mot de passe et port PostgreSQL

# Initialiser les tables + données de démo
python -m app.init_db

# Lancer le serveur
uvicorn app.main:app --reload
# → http://localhost:8000
# → Documentation : http://localhost:8000/docs
```

---

## Étape 2 — Frontend

```bash
cd subflow

# Installer les dépendances
npm install

# Lancer le serveur
npm run dev
# → http://localhost:3001
```

---

## Étape 3 — Se connecter

Ouvrir **http://localhost:3001** dans le navigateur.

| Compte | Email | Mot de passe |
|--------|-------|-------------|
| Administrateur | admin@subflow.cg | admin123 |
| Agent | agent@subflow.cg | agent123 |

---

## Architecture

```
SubFlow
├── subflow/              ← Frontend React
│   ├── src/
│   │   ├── pages/        ← Dashboard, Abonnés, Paiements, etc.
│   │   ├── components/   ← Layout, Sidebar, Topbar
│   │   ├── services/     ← api.js (appels HTTP)
│   │   └── contexts/     ← AuthContext (session)
│   └── package.json
│
└── subflow-backend/      ← Backend FastAPI
    ├── app/
    │   ├── models.py     ← Tables SQLAlchemy
    │   ├── schemas.py    ← Validation Pydantic
    │   ├── database.py   ← Connexion PostgreSQL
    │   └── routers/      ← Routes API
    └── requirements.txt
```

---

## Fonctionnalités

✅ Gestion des abonnés (CRUD + recherche + filtres)
✅ Gestion des paiements (CRUD + historique + stats)
✅ Grille tarifaire (Basic / Standard / Premium)
✅ Statistiques avancées (graphiques Recharts)
✅ Notifications SMS (simulées, branchables Twilio/Orange)
✅ Gestion des utilisateurs (admins et agents)
✅ Authentification par token (Bearer)
✅ Rôles Admin / Agent
✅ Interface dark mode responsive
✅ Documentation API interactive (/docs)

---

## Pour aller plus loin

### Activer l'envoi SMS réel (Twilio)
```bash
pip install twilio
```
Dans `.env` :
```
TWILIO_SID=votre_sid
TWILIO_TOKEN=votre_token
TWILIO_FROM=+1234567890
```

### Passer en production
```bash
# Build frontend
cd subflow && npm run build

# Lancer backend en production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```
