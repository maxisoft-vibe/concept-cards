# Concept Card Extender - Documentation

Welcome to the documentation for the **Concept Card Extender** project.

## 📚 Documentation Index

1. [**01. Word Generator Journey & Technical Guide**](journey/01_WORD_GENERATOR_JOURNEY.md)
   - Comprehensive overview of the word generator pipeline with DeepSeek API & LiteLLM.
   - Engineering challenges (caching, schema validation, deduplication).
   - Dataset statistics (8,695 unique words, difficulty breakdown, token costs).

2. [**02. Web App & PWA Journey & Technical Guide**](journey/02_WEB_APP_AND_PWA_JOURNEY.md)
   - High-fidelity physical card replication & Mulberry32 deterministic generator.
   - Features: Secret word selection, DuckDuckGo search, SVG vector exporter, Trianglify background.
   - PWA Progressive Web App, Service Worker offline caching, Dark/Light theme engine, mobile 100dvh responsiveness.

3. [**03. Angular 22, Zoneless, Vitest & CI/CD Modernization**](journey/03_ANGULAR22_ZONELESS_CI_AND_TESTING_JOURNEY.md)
   - Full migration to Angular 22.1.2, TypeScript 6.0.3, and Node.js 24 LTS (Krypton).
   - Pure Zoneless change detection (`provideZonelessChangeDetection`), Signal Inputs/Outputs/Queries, and `@let`.
   - Comprehensive Vitest 4 unit test harness.
   - Git history sanitization with BFG Repo-Cleaner and GitHub Release dataset distribution.
   - CI/CD quality gates with ESLint flat config, strict type checks, PR validation, and Dependabot.

4. [**04. Dataset Curation, Chunking & Merging Journey**](journey/04_DATASET_CURATION_AND_MERGE_JOURNEY.md)
   - Granular chunk manager (`split_and_manage_words.py`) across 41 chunks.
   - Pruning criteria, uniconable jargon removal, and `deleted_words.txt` ledger.
   - Systematic rehabilitation of 160 board-tested concepts (*Sanglier, Narval, Phénix, Tour Eiffel*).
   - Strict 4-level semantic hierarchy preservation (Levels 0–3) and final 6,175-concept consolidation.

5. [**05. PWA Offline Performance & Update System Journey**](journey/05_PWA_OFFLINE_PERF_AND_UPDATE_SYSTEM_JOURNEY.md)
   - 0 ms instant offline startup via Navigation Preload and 400 ms timeout race.
   - Deterministic build metadata synchronization (`app-version.json` & `src/app/version.ts`).
   - Reactive [`UpdateService`](../web/src/app/services/update.service.ts) detecting code (`buildHash`) and dataset changes (`datasetVersion`).
   - Global 1-minute rate limiting (cooldown / debounce) protecting mobile data.
   - Non-intrusive floating [`UpdateToastComponent`](../web/src/app/components/update-toast/) with smooth controller change activation.

6. [**06. Android Offline Standalone Application (Capacitor) Journey**](journey/06_ANDROID_CAPACITOR_OFFLINE_APP_JOURNEY.md)
   - Packaging natif Android ultra-léger (4.53 MB APK, universal DEX bytecode).
   - Architecture 0 permission (`android.permission.INTERNET` supprimée).
   - Détection dynamique de plateforme (`Capacitor.isNativePlatform()`), désactivation du polling web superflu.
   - Embarquement local du dictionnaire (6 175 mots) et intégration du Web Share API pour le partage et l'export SVG.

7. [**JSON Schemas**](schemas/)
   - [`words_generated.schema.json`](schemas/words_generated.schema.json): JSON Draft-07 schema for `res/words_generated.json` and `res/cache_words_gen.json`.
   - [`llm_concept_response.schema.json`](schemas/llm_concept_response.schema.json): JSON Draft-07 schema for DeepSeek payload output (`ConceptResponse`).

8. [**External Game References**](links.md)
   - Links to official rules, game reviews, and online references for *Concept*.

---

## 🛠️ Quick Commands

```bash
# === Backend / Word Generation ===
# Preview prompts without calling API
uv run python src/concept/generate_words.py --dry-run

# Resume query generation from checkpoint
uv run python src/concept/generate_words.py

# === Frontend / Web Application ===
cd web

# Run Vitest unit tests suite
npm test

# Start local development server
npm start

# Build for GitHub Pages deployment
npm run build:gh-pages
```
