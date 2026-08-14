# Concept Cards Web Application

> **Application web Angular moderne, réactive et 100 % hors-ligne (PWA) pour le jeu Concept.**

---

## 🛠️ Stack Technique

* **Framework** : Angular 19+ (Zoneless Change Detection, OnPush, Signals, Signal Inputs/Outputs/Queries, Control Flow `@if`/`@for`/`@let`/`@empty`)
* **Tests Unitaires** : Vitest + JSDOM + `@analogjs/vite-plugin-angular`
* **Performance** : 0 polyfills runtime (`zone.js` éliminé), ~92 kB transfer initial
* **Rendu & Mathématiques** : Algorithme de triangulation Trianglify en pur TypeScript + PRNG Mulberry32 déterministe
* **Persistance & Hors-ligne** : IndexedDB (`ConceptCardDB`) + Service Worker (`sw.js`)

---

## 📜 Commandes Disponibles

```bash
# Lancer le serveur de développement local
npm start
# ou
npm run ng serve

# Lancer la suite complète de tests unitaires (Vitest)
npm test

# Lancer Vitest en mode interactif / watch
npm run test:watch

# Compiler le bundle de production standard
npm run build

# Compiler le bundle de production pour GitHub Pages (base-href relative)
npm run build:gh-pages
```

---

## 🧪 Structure des Tests

Les tests unitaires couvrent l'intégralité des services et composants clés :
* `src/app/services/card-generator.service.spec.ts` : Déterminisme Mulberry32, répartition 3-3-3 et diversité thématique.
* `src/app/services/card-svg-exporter.service.spec.ts` : Échappement XML, dimensions et déclencheur de téléchargement.
* `src/app/services/theme.service.spec.ts` : Bascule de thème, persistance et synchronisation DOM.
* `src/app/services/card-history.service.spec.ts` : Pile d'historique de navigation et synchronisation des graines.
* `src/app/services/word-storage.service.spec.ts` : Chargement du dictionnaire et calcul des signaux réactifs.
* `src/app/components/concept-card/concept-card.component.spec.ts` : Liaisons Signal Inputs et émissions d'événements.
* `src/app/app.component.spec.ts` : Démarrage et intégration de l'application.
