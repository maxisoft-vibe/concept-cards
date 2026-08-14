# Concept Cards Web Application

> **Application web Angular moderne, réactive et 100 % hors-ligne (PWA) pour le jeu Concept.**

---

## 🛠️ Stack Technique

* **Framework** : Angular 22.1.2 (Zoneless Change Detection `provideZonelessChangeDetection`, OnPush, Signals, Signal Inputs/Outputs/Queries, Control Flow `@if`/`@for`/`@let`/`@empty`)
* **Langage & Compilateur** : TypeScript 6.0.3 (ESM natif)
* **Runtime** : Node.js 24 LTS (Krypton)
* **Linter & Qualité** : ESLint 10 + `@angular-eslint` (Flat Config) & Strict Type Checking (`tsc --noEmit`)
* **Tests Unitaires** : Vitest 4.1.10 + JSDOM 30 + `@analogjs/vite-plugin-angular` (28 tests unitaires 100 % passants en ~3s)
* **Performance** : 0 polyfills runtime (`zone.js` éliminé), ~99 kB transfer initial
* **Rendu & Mathématiques** : Algorithme de triangulation Trianglify en pur TypeScript + PRNG Mulberry32 déterministe
* **Persistance & Hors-ligne** : IndexedDB (`ConceptCardDB`) + Service Worker (`sw.js`)

---

## 📜 Commandes Disponibles

```bash
# Lancer le serveur de développement local
npm start
# ou
npm run ng serve

# Lancer la validation complète de types (TypeScript strict)
npm run type-check

# Lancer le linter ESLint
npm run lint

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

Les 28 tests unitaires couvrent l'intégralité des services et composants clés :
* `src/app/services/card-generator.service.spec.ts` (6 tests) : Déterminisme Mulberry32, répartition 3-3-3 et diversité thématique.
* `src/app/services/card-svg-exporter.service.spec.ts` (5 tests) : Échappement XML, dimensions et déclencheur de téléchargement.
* `src/app/services/theme.service.spec.ts` (5 tests) : Bascule de thème, persistance et synchronisation DOM.
* `src/app/services/card-history.service.spec.ts` (5 tests) : Pile d'historique de navigation et synchronisation des graines.
* `src/app/services/word-storage.service.spec.ts` (3 tests) : Chargement du dictionnaire et calcul des signaux réactifs.
* `src/app/components/concept-card/concept-card.component.spec.ts` (2 tests) : Liaisons Signal Inputs et émissions d'événements.
* `src/app/app.component.spec.ts` (2 tests) : Démarrage et intégration de l'application.

---

## 📚 Documentation Détaillée

Consultez les guides d'ingénierie dans [`../docs/journey/`](../docs/journey/) :
* [**02. Web App & PWA Journey**](../docs/journey/02_WEB_APP_AND_PWA_JOURNEY.md)
* [**03. Angular 22, Zoneless, Vitest & CI/CD Modernization**](../docs/journey/03_ANGULAR22_ZONELESS_CI_AND_TESTING_JOURNEY.md)
