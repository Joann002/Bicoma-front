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

- Node.js 22.18+ ou 24.12+ (voir `engines` dans package.json)
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
npm test           # tests Vitest, stores et composants, sans backend
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

## Étagère : filtres partageables et export

La recherche, le type, le statut, la note minimale, les tags et la page sont
conservés dans l’URL. Exemple : `/?type=book&status=done&rating=4&tag=favori&page=2`.
Le bouton retour du navigateur restaure les filtres. La saisie de recherche est
regroupée pendant 300 ms ; un changement de filtre revient à la première page.
Les valeurs mal formées sont ignorées, la recherche est bornée à 200 caractères
et 20 tags peuvent être transmis. L’API reste l’autorité sur les droits et filtres.

« Exporter cette page (CSV) » télécharge uniquement les éléments actuellement
chargés, avec vos notes personnelles ; ce n’est pas une sauvegarde complète de la
collection. Le fichier UTF-8 avec BOM utilise des virgules et échappe guillemets
et retours à la ligne. Les cellules ressemblant à des formules de tableur sont
préfixées par une apostrophe. Conserver le CSV dans un emplacement privé.
L’export est désactivé pendant un chargement ou une erreur.

## Requêtes, sessions et stockage

Les chargements de collection sont annulables et les réponses obsolètes sont
ignorées, même si l’adaptateur réseau ne respecte pas l’annulation. Une erreur de
chargement est affichée avec une reprise explicite ; elle n’est plus présentée
comme une collection vide. Fiches et formulaires réagissent aux changements
d’identifiant, et les modifications non enregistrées demandent confirmation avant
navigation. Les mutations ne sont pas automatiquement relancées : après un délai
ou une coupure, vérifier le résultat avant de réessayer.

Le jeton reste stocké dans localStorage lorsque disponible, donc accessible au
JavaScript de cette origine : aucune migration vers des cookies httpOnly ni
modification du backend n’est incluse. Si le stockage est refusé, une session en
mémoire reste utilisable, avec un message indiquant sa perte au rechargement.
Changer de compte, se déconnecter ou recevoir un 401 de la session active vide les
caches privés et remonte les écrans protégés. Un ancien 401 ne déconnecte pas un
nouveau jeton. Une panne réseau seule ne supprime pas le jeton ; le profil peut
être rechargé. Les changements de jeton d’un autre onglet sont pris en compte.

La vue `/share/:token` n’envoie jamais le jeton privé aux routes `/public/*` et
présente des cartes non interactives ; les erreurs réseau sont distinguées d’un
lien inexistant. La déconnexion locale reste possible hors ligne ; elle ne prouve
pas la révocation du jeton côté serveur. Les autorisations restent vérifiées par
l’API Laravel. Aucun mécanisme client ne remplace cette protection.

## Clavier, mobile et affichage

Menu mobile avec état ouvert annoncé, fermeture par Échap, focus contenu dans le
panneau et retour au déclencheur ; panneau fermé et contenu derrière le menu non
accessibles au clavier. Le défilement est restauré à la fermeture. Un lien
« Aller au contenu » évite la navigation. La notation éditable utilise des radios
et les flèches du clavier, avec une action pour effacer la note. Une note en lecture
seule ne contient pas de boutons, notamment dans les cartes-liens.

Thème valide même sans stockage, focus visible, mouvement réduit respecté,
messages de reprise accessibles et notifications bornées à cinq. Les couvertures
acceptent HTTP(S) sans identifiants ou un chemin relatif local ; les images
cassées de carte retombent sur un substitut visuel.

## Vérifications et portée

```bash
npm ci
npm test
npm run build
```

Vitest utilise happy-dom et Vue Test Utils pour tester sessions, client HTTP,
concurrence des stores, filtres, pagination, CSV, erreurs, clavier et composants.
La CI exécute les tests et le build (incluant vue-tsc) sur Node 22 et 24, sans
secrets ni achat de service. Prettier est disponible pour garder les modifications
lisibles (`npm exec prettier -- --write --single-quote --no-semi fichier.vue`).

Les contrôles navigateur de cette maintenance utilisent une API simulée à partir
des contrats déjà employés par le frontend. Aucun changement, analyse ou démarrage
de `Bicoma-api` n’est nécessaire à ces tests. Ils ne prouvent pas la compatibilité
de bout en bout avec une instance Laravel réelle : la vérifier avant déploiement,
notamment pour les réponses paginées et les règles de validation. Aucun import
Open Library/TMDB/RAWG ni enrichissement distant n’est exécuté par la suite.
