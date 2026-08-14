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
   - Architecture: Angular 19+ Zoneless, Vitest test harness, Service Worker offline PWA, Dark/Light theme engine.
   - Mobile optimizations for small screens (360 × 740 px Galaxy S8+, 100dvh fit, touch swipe).
   - Automated GitHub Actions deployment pipeline to GitHub Pages with test validation.

3. [**JSON Schemas**](schemas/)
   - [`words_generated.schema.json`](schemas/words_generated.schema.json): JSON Draft-07 schema for `res/words_generated.json` and `res/cache_words_gen.json`.
   - [`llm_concept_response.schema.json`](schemas/llm_concept_response.schema.json): JSON Draft-07 schema for DeepSeek payload output (`ConceptResponse`).

4. [**External Game References**](links.md)
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
