# Concept Card Extender - Documentation

Welcome to the documentation for the **Concept Card Extender** project.

## 📚 Documentation Index

1. [**Word Generator Journey & Technical Guide**](journey/01_WORD_GENERATOR_JOURNEY.md)
   - Comprehensive overview of the word generator pipeline.
   - Project milestones, technical challenges, and engineering solutions.
   - Dataset statistics (8,695 unique words, difficulty breakdown, API costs).
   - Next steps for Concept Card assembly.

2. [**JSON Schemas**](schemas/)
   - [`words_generated.schema.json`](schemas/words_generated.schema.json): JSON Draft-07 schema for `res/words_generated.json` and `res/cache_words_gen.json`.
   - [`llm_concept_response.schema.json`](schemas/llm_concept_response.schema.json): JSON Draft-07 schema for DeepSeek payload output (`ConceptResponse`).

3. [**External Game References**](links.md)
   - Links to official rules, game reviews, and online references for *Concept*.

---

## 🛠️ Quick Commands

```bash
# Preview prompts without calling API
uv run python src/concept/generate_words.py --dry-run

# Test pipeline with mock responses (no API cost)
uv run python src/concept/generate_words.py --mock --limit 5

# Resume query generation from checkpoint
uv run python src/concept/generate_words.py

# Debug run with raw LLM logging
uv run python src/concept/generate_words.py --log-raw-response --limit 1
```
