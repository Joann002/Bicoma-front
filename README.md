# Bicoma — Frontend

SPA du gestionnaire de collection personnelle **Bicoma** (livres, films, séries, jeux).
Construite avec **Vue 3**, **TypeScript**, **Vite**, **Vue Router** et **Pinia**, dans une
esthétique « bibliothèque chaleureuse » avec mode sombre et clair.

L'API Laravel correspondante se trouve dans le dépôt `Bicoma-api`.

## Fonctionnalités

- Authentification (connexion / inscription) avec token Bearer
- **Étagère** : grille de couvertures avec recherche en direct (debounce), filtres
  (type, statut, note, tags) et chargement paresseux des images
- Fiche détaillée, création et édition d'un élément
- Suivi des prêts (retours, retards)
- Import depuis Open Library / TMDB / RAWG avec ajout rapide
- Tableau de bord de statistiques (graphiques CSS) et défi annuel
- Recommandations personnalisées
- Gestion des listes partagées et vue publique en lecture seule
- Système de tokens de design, mode sombre/clair, interface responsive

## Prérequis

- Node.js 20.19+
- L'API `Bicoma-api` en cours d'exécution

## Installation

```bash
npm install
cp .env.example .env   # ajustez VITE_API_URL si nécessaire
```

Par défaut l'application cible `http://localhost:8000/api`.

## Lancement

```bash
npm run dev        # serveur de développement (http://localhost:5173)
npm run build      # build de production
npm run type-check # vérification des types
```

## Structure

```
src/
  assets/main.css      tokens de design + styles de base
  lib/                 client axios, types TypeScript
  composables/         thème, toasts
  stores/              Pinia (auth, items, tags, loans, stats)
  components/          BaseIcon, ItemCard, RatingStars, ToastHost
  layouts/AppLayout    coquille avec barre latérale
  views/               écrans (étagère, import, prêts, stats, partage…)
  router/              routes + garde d'authentification
```
