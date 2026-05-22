# SubFlow — Frontend (React + Vite)

## Stack technique
- **React 18** + **React Router v6**
- **Vite** — bundler
- **Recharts** — graphiques
- **CSS custom** — dark mode

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev

# 3. Ouvrir dans le navigateur
# http://localhost:3001
```

## Modules disponibles

| Module | Description |
|--------|-------------|
| Dashboard | Stats globales, abonnés et paiements récents |
| Abonnés | Liste, recherche, filtres, CRUD complet |
| Paiements | Historique, stats, CRUD complet |
| Tarifs | Grille tarifaire, vue cartes et tableau |
| Statistiques | Graphiques revenus, paiements, répartitions |
| SMS | Notifications simulées, historique |
| Utilisateurs | Gestion agents/admins (admin seulement) |
| Aide | Guide, FAQ, support |

## Connexion au backend

Le frontend communique avec le backend via :
- **Base URL** : http://localhost:8000
- **Auth** : Token Bearer stocké dans localStorage

## Comptes de démo

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@subflow.cg | admin123 | Administrateur |
| agent@subflow.cg | agent123 | Agent |
