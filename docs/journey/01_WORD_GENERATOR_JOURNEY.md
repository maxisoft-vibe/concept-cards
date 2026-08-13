# Concept Card Extender - Word Generator Project Documentation

## 1. Project Overview & Objective

The goal of this project is to build a **Concept Card Extender**—a system capable of generating new French words, cultural expressions, and terms tailored for the board game *Concept* (Repos Production).

The first step of this project was to create an automated, safe, and cost-efficient word generator script [`src/concept/generate_words.py`](file:///d:/maxisoft/PycharmProjects/Concept/src/concept/generate_words.py) using the **DeepSeek Chat API** via `litellm`.

---

## 2. System Architecture & Components

```
PycharmProjects/Concept/
├── res/
│   ├── guide.md                 # Official game rules & mechanics guide
│   ├── board.md                 # Official board summary & icon mappings
│   ├── cards.md                 # Original card transcriptions
│   ├── prompts/
│   │   └── names_gen.txt        # Input topics (170 prompt queries)
│   ├── cache_words_gen.json     # State checkpoint file
│   └── words_generated.json     # Consolidated output dataset
├── src/concept/
│   ├── generate_words.py        # Main generation script with CLI
│   └── test_deepseek.py         # Initial testing & prototype script
└── docs/
    ├── README.md                # Documentation index
    ├── WORD_GENERATOR_JOURNEY.md# Project history, technical details & status
    └── schemas/
        ├── words_generated.schema.json
        └── llm_concept_response.schema.json
```

### Prompt Construction Pipeline
Each query prompt combines:
1. Game rules & iconability criteria (`res/guide.md`)
2. Board icon reference guide (`res/board.md`)
3. Original sample cards (`res/cards.md`)
4. Output format constraints & Pydantic schema rules (`PROMPT_INSTRUCTIONS`)
5. Target topic line from `res/prompts/names_gen.txt`

---

## 3. The Engineering Journey & Technical Challenges

### Challenge 1: DeepSeek API Cost Safety & Continuability
- **Problem**: DeepSeek API calls cost money. Re-running the script from scratch after network glitches or interruptions could cause duplicate API charges.
- **Solution**: 
  - Implemented incremental checkpointing after every single completed query (`res/cache_words_gen.json`).
  - Added smart prompt matching (`clean_prompt` & `index`). On re-runs, successful queries are skipped automatically without triggering API calls.
  - Added CLI options `--limit N` (batching) and `--mock` (testing without API spending).

### Challenge 2: LiteLLM Response Objects Unpacking
- **Problem**: `litellm.responses()` returns a complex nested object (`Response` -> `.output` list -> `GenericResponseOutputItem` -> `.content` list -> `OutputText`). Calling `str(raw_output)` produced stringified repr strings (`id='39e32b2e...'`), which broke Pydantic JSON parsing with `json_invalid`.
- **Solution**: Created a fully recursive text extractor function `extract_response_text(raw_output)` that dynamically unpacks nested response classes, list containers, and text properties to isolate the exact JSON string payload.

### Challenge 3: External Modifications to Prompt Files
- **Problem**: `res/prompts/names_gen.txt` grew from 162 to 170 lines during development. Plain numerical index caching would mismatch shifted prompt lines.
- **Solution**: The cache engine was updated to match queries by **prompt text content** as well as query position.

### Challenge 4: File Size Bloat from `occurrences` Array
- **Problem**: The deduplicated `words` array initially stored an `occurrences` list containing redundant dictionary snapshots of every single query appearance, bloating the output JSON file to > 6.2 MB.
- **Solution**: Removed `occurrences` from `deduplicate_all_words()` while preserving `query_indices: [idx1, idx2]`. Run a cleanup script with `.bak` backups, reducing dataset size by ~30% to **4.33 MB**.

---

## 4. Dataset & Execution Analytics

From the full execution run on 170 prompt queries:

| Metric | Value |
| :--- | :--- |
| **Total Prompt Queries** | 170 |
| **Successful Queries** | 169 (99.4%) |
| **Failed Queries** | 1 (0.6% - Query #37 token truncation) |
| **Total Unique Deduplicated Words** | **8,695** |
| **Words with Multi-Topic Overlap** | 780 |
| **Total API Cost** | **~$0.20 USD** |
| **Total Tokens Consumed** | ~2,262,910 |
| **Output File Size** | 4.33 MB |

### Difficulty Distribution (`d` score)
- 🔵 **Easy (`d=0`)**: 2,974 words (34.4%)
- 🔴 **Medium (`d=1`)**: 3,735 words (43.2%)
- 🔘 **Hard (`d=2`)**: 1,928 words (22.3%)

---

## 5. Current Task & Next Steps

### Current Task Status
- [x] Build safe, retryable, continuable generator script (`src/concept/generate_words.py`).
- [x] Read and parse `res/prompts/names_gen.txt` (ignoring `#` and `//`).
- [x] Implement Pydantic schema validation & retry mechanism.
- [x] Dynamic relative path resolution using `Path(__file__).parent`.
- [x] Implement `--log-raw-response` debugging flag.
- [x] Run full DeepSeek execution across 170 queries.
- [x] Clean up `occurrences` array and verify zero word duplicates.
- [x] Create project documentation & JSON Draft-07 schemas in `docs/`.

### Next Task: Concept Card Assembly (Card Extender)
The next step in the Concept Card Extender pipeline will be taking the deduplicated word database (8,695 words) and grouping them into balanced 3x3 (9-item) Concept cards according to game designer rules:
- Each card must have 3 Easy (1-3), 3 Medium (4-6), and 3 Hard (7-9) terms.
- Each card must maintain thematic variety (e.g. 1 Object + 1 Person/Title + 1 Expression/Place).
