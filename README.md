# 🎴 Concept Cards Generator

> **Générateur infini de cartes et compagnon de jeu pour le jeu de société *Concept*.**  
> 100 % statique, ultra-rapide, responsive et pleinement fonctionnel hors-ligne (PWA) sur GitHub Pages.

---

## ✨ Fonctionnalités

- 🎲 **Génération infinie de cartes (8 695 mots)** :
  - Respect scrupuleux de la répartition officielle : **3 Facile** (🔵 1 à 3), **3 Moyen** (🔴 4 à 6) et **3 Difficile** (🔘 7 à 9).
  - Algorithme de sélection évitant la redondance thématique sur une même carte.
- 🔗 **Graines déterministes (*Seeds*) & Partage** :
  - Chaque carte possède un identifiant unique (ex: `#k8f3z`). Partagez l'URL pour donner exactement la même carte à vos amis.
  - Historique complet avec navigation naturelle (boutons *Précédente* / *Suivante* et historique du navigateur).
- 🎯 **Mode « Mot Secret » immersif** :
  - Cliquez sur un mot pour le focaliser : le concept choisi est mis en valeur et les 8 autres s'estompent.
  - Bouton **Rechercher** discret pour consulter la définition d'un mot ou d'une œuvre sur DuckDuckGo (mode privé sans pistage).
- 📥 **Export Vectoriel SVG Haute Résolution** :
  - Téléchargez en un clic la carte au format vectoriel `.svg` prêt à l'impression.
- 💡 **Indices thématiques optionnels** :
  - Affichez ou masquez d'un clic les indices d'origine avec une animation de déploiement fluide.
- 🎨 **Fond dynamique Trianglify & Animations 60 fps** :
  - Maillage low-poly généré à partir de la graine de la carte avec fondu enchaîné doux à chaque tirage.
  - Transitions directionnelles physiques (glissement gauche/droite et gestes tactiles *Swipe* sur mobile).
- 🌓 **Mode Sombre & Clair** :
  - Détection automatique des préférences du système et bouton de bascule dédié dans l'en-tête (sauvegardé dans le navigateur).
- ⚡ **100 % Hors-ligne & PWA (Progressive Web App)** :
  - Architecture **Zoneless** ultra-légère sans `zone.js` (gain de taille de bundle).
  - Mise en cache automatique via Service Worker (`sw.js`) et base de données locale **IndexedDB**.
  - Installable comme application autonome sur smartphone (Android/iOS) et ordinateur.

---

## 🛠️ Technologies

- **Frontend** : Angular 19+ (Zoneless Change Detection, Signals, Signal Inputs/Outputs/Queries, Control Flow `@if`/`@for`, SCSS Vanilla)
- **Tests** : Vitest + JSDOM + `@analogjs/vite-plugin-angular` (28 tests unitaires)
- **Rendu Vectoriel** : Pure SVG & HTML/CSS (compatible navigateurs récents et anciens Android WebView)
- **Algorithme de Triangulation** : Trianglify en pur TypeScript avec PRNG Mulberry32
- **Déploiement** : GitHub Pages via GitHub Actions automatisé (`deploy.yml`) avec validation des tests

---

## 🚀 Développement Local

```bash
# Aller dans le dossier web
cd web

# Installer les dépendances
npm install

# Lancer la suite de tests unitaires (Vitest)
npm test

# Lancer le serveur de développement
npm start
```

Rendez-vous sur `http://localhost:4200/`.

---

## 📦 Déploiement GitHub Pages

Le déploiement est entièrement automatisé à chaque `git push` sur la branche `main` grâce au workflow GitHub Actions [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) (avec exécution préalable des tests Vitest sous Node.js 22+).
