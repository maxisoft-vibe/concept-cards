import os
import sys
import json
import time
import re
import random
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ValidationError

try:
    from litellm import responses
except ImportError:
    responses = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("concept_word_gen")


# --- Pydantic Schema Definitions ---

class WordEntry(BaseModel):
    n: str = Field(description="Entry name, short and unambiguous as printed on cards")
    y: Optional[int] = Field(default=None, description="Year, if applicable")
    c: float = Field(default=0.5, description="Complexity score [0.0 to 1.0]")
    cc: float = Field(default=0.5, description="Commonness score [0.0 to 1.0]")
    d: int = Field(default=1, description="Difficulty mapping to [0: easy, 1: average, 2: hard]")


class TopSubject(BaseModel):
    query: str = Field(description="The query title or topic")
    subject: str = Field(description="Short summary of the subject")
    n: int = Field(description="Number of items returned")
    values: List[WordEntry] = Field(default_factory=list, description="List of generated words/expressions")


class ConceptResponse(BaseModel):
    top: TopSubject


# --- Path Helper & File Operations ---

def get_default_paths() -> Dict[str, Path]:
    src_dir = Path(__file__).resolve().parent
    project_root = src_dir.parent.parent
    res_dir = project_root / "res"
    return {
        "guide": res_dir / "guide.md",
        "board": res_dir / "board.md",
        "cards": res_dir / "cards.md",
        "prompts_file": res_dir / "prompts" / "names_gen.txt",
        "output_file": res_dir / "words_generated.json",
        "cache_file": res_dir / "cache_words_gen.json"
    }


def read_text_file(path: Path) -> str:
    if not path.exists():
        logger.warning(f"File not found: {path}")
        return ""
    return path.read_text(encoding="utf-8")


def parse_prompts_file(file_path: Path) -> List[str]:
    if not file_path.exists():
        raise FileNotFoundError(f"Prompts file not found at: {file_path}")
    
    prompts = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped:
                continue
            if stripped.startswith("//") or stripped.startswith("#"):
                continue
            prompts.append(stripped)
    return prompts


# --- DeepSeek Query Runner ---

PROMPT_INSTRUCTIONS = r"""
IMPORTANT: le but n'est pas de faire une carte mais de faire une liste de mots/expression pour une carte !

Le but de cette requette est de faire un top 100 de mots, expressions, peu importe.
Compatible pour une utilisation future comme entrée dans une carte du jeu concept 2.0.

Note que 100 mots n'est pas une nécessité. Si pas asser d'entrées ou des entrées sont incompatible avec le jeu concept ou beaucoup trop difficile à faire deviné alors retrograde en top 50, 10, 5, 3.
Une liste grande serais vraiment plus apprécier. Ne soit pas avare. mais qualité avant quantité !
Soit intelligent, ainsi ne fait pas des nom simpliste tel que "robe bleu" ou "toît rouge" lorsque on te demande des mots en lien avec des couleurs ...
(eg juste ajouter le qualificatif a un nom)
Pense à ce que le resultatait un effet surprenant, fun. Pas des évidances ou des redondances. Si il y a des jeu de mots fin, n'hesite surtout pas !

La population cible est un individue née entre 1990 et 2008, age moyen 25 ans, née en france, avec ref culturel standard.
Homme ou Femme, IQ standard, scolarité standard.

Le but des mots rechercher n'est pas de parler/suggerer de morosité, de politique, drogues, explicit content ou autres. Il faut que le jeux reste bon enfants mais possible d'avoir des référance adultes ou subtiles. 

Utilise et abuse de la fonction de recherche pour trouver l'inspiration.

Les noms doivent être en francais sauf si le nom dans la langue original est plus courament utilisé/reconnus.

IMPORTANT: Output as valid json entry. output nothing else as i'll use a json parser with schema validation !

IMPORTANT: output such as:

{"top": {
    "query": "the topX query on which subject",
    "subject": "the subject in short term",
    "n": X,
    "values": [
        {
            "n": "entry name, short and unambiguous as it'll be printed on the cards",
            "y": 2016, // year, if applicable
            "c": 0.3, // between 0.0 and 1.0, complexity evaluation to express or guess the name using the board game
            "cc": 0.5, // between 0.0 and 1.0, commonness score, is that a exentric, not obvious term
            "d": 0 // difficulty as a int number in [0, 1, 2] (which maps to [easy, Average, HARD])
        }
    ]
    }
}

Important: Pour une version du jeu francaise !

Par la suite le sujet du TOP va être réveler ...
"""


def build_full_prompt(guide_txt: str, board_txt: str, cards_txt: str, query_line: str) -> str:
    parts = []
    if guide_txt:
        parts.append(guide_txt)
    if board_txt:
        parts.append(board_txt)
    if cards_txt:
        parts.append(cards_txt)
    parts.append(PROMPT_INSTRUCTIONS)
    parts.append(f"\nSujet du TOP:\n{query_line}")
    return "\n\n***\n\n".join(parts)


def extract_response_text(raw_output: Any) -> str:
    """Adaptive and dynamic text extractor for LiteLLM responses object shapes."""
    if raw_output is None:
        return ""
        
    # 1. Direct string
    if isinstance(raw_output, str):
        return raw_output

    # 2. Direct dict
    if isinstance(raw_output, dict):
        if "top" in raw_output:
            return json.dumps(raw_output, ensure_ascii=False)
        if "choices" in raw_output and isinstance(raw_output["choices"], list) and len(raw_output["choices"]) > 0:
            c0 = raw_output["choices"][0]
            if isinstance(c0, dict) and "message" in c0:
                msg = c0["message"]
                if isinstance(msg, dict) and "content" in msg:
                    return extract_response_text(msg["content"])
        if "output" in raw_output:
            return extract_response_text(raw_output["output"])

    # 3. Object with .output attribute (litellm responses object)
    if hasattr(raw_output, "output"):
        out = getattr(raw_output, "output")
        extracted = extract_response_text(out)
        if extracted and not extracted.startswith("id='"):
            return extracted

    # 4. Object with .choices attribute (litellm completion object)
    if hasattr(raw_output, "choices"):
        try:
            choices = getattr(raw_output, "choices")
            if choices and len(choices) > 0:
                c0 = choices[0]
                if hasattr(c0, "message"):
                    msg = getattr(c0, "message")
                    if hasattr(msg, "content"):
                        extracted = extract_response_text(getattr(msg, "content"))
                        if extracted and not extracted.startswith("id='"):
                            return extracted
        except Exception:
            pass

    # 5. Iterable list/tuple of items (e.g. output list)
    if isinstance(raw_output, (list, tuple)):
        for item in raw_output:
            extracted = extract_response_text(item)
            if extracted and not extracted.startswith("id='"):
                return extracted

    # 6. Object with .content attribute (e.g. GenericResponseOutputItem)
    if hasattr(raw_output, "content"):
        content = getattr(raw_output, "content")
        extracted = extract_response_text(content)
        if extracted and not extracted.startswith("id='"):
            return extracted

    # 7. Object with .text attribute (e.g. OutputText)
    if hasattr(raw_output, "text"):
        txt = getattr(raw_output, "text")
        if isinstance(txt, str) and txt:
            return txt

    return str(raw_output)


def extract_json_payload(text: str) -> str:
    """Dynamically extracts and cleans the JSON string payload from LLM responses."""
    text = text.strip()
    
    # Remove markdown code block wrappers if present
    if "```" in text:
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            return match.group(1).strip()

    # Try standard json loads check
    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        pass

    # Fallback: extract substring between first '{' and last '}'
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = text[first_brace:last_brace + 1].strip()
        try:
            json.loads(candidate)
            return candidate
        except json.JSONDecodeError:
            return candidate

    return text


def mock_deepseek_call(query_line: str, index: int) -> str:
    sample_words = [
        {"n": f"Mot Exemple {index}A", "y": 2010, "c": 0.3, "cc": 0.8, "d": 0},
        {"n": f"Mot Exemple {index}B", "y": None, "c": 0.5, "cc": 0.5, "d": 1},
        {"n": "Mot Commun Doublon", "y": 2005, "c": 0.4, "cc": 0.9, "d": 0}
    ]
    data = {
        "top": {
            "query": query_line,
            "subject": query_line[:40],
            "n": len(sample_words),
            "values": sample_words
        }
    }
    return json.dumps(data, ensure_ascii=False)


def call_deepseek(
    prompt_str: str,
    query_line: str,
    index: int,
    mock: bool = False,
    log_raw_response: bool = False
) -> tuple[ConceptResponse, str]:
    if mock:
        logger.info(f"[MOCK API] Simulating query #{index}: {query_line[:50]}...")
        raw_output = mock_deepseek_call(query_line, index)
    else:
        if responses is None:
            raise RuntimeError("litellm library is not installed or available.")
        
        logger.info(f"[API CALL] Querying DeepSeek for #{index}: {query_line[:50]}...")
        raw_output = responses(
            model="deepseek/deepseek-chat",
            base_url="https://api.deepseek.com",
            input=prompt_str,
            tools=[{"type": "web_search"}],
            response_format={"type": "json_object"}
        )

    raw_text = extract_response_text(raw_output)
    
    if log_raw_response:
        logger.info(f"--- RAW RESPONSE FOR QUERY #{index} ---")
        logger.info(raw_text)
        logger.info("---------------------------------------")

    cleaned_json = extract_json_payload(raw_text)
    
    # Validate using Pydantic
    try:
        parsed = ConceptResponse.model_validate_json(cleaned_json)
        return parsed, raw_text
    except ValidationError as ve:
        if not log_raw_response:
            logger.warning(f"[PARSE ERROR] Raw text received: {raw_text[:300]}...")
        raise ve


def call_with_retry(
    prompt_str: str,
    query_line: str,
    index: int,
    max_retries: int = 3,
    delay: float = 1.0,
    mock: bool = False,
    log_raw_response: bool = False
) -> tuple[ConceptResponse, str]:
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            res, raw_txt = call_deepseek(
                prompt_str=prompt_str,
                query_line=query_line,
                index=index,
                mock=mock,
                log_raw_response=log_raw_response
            )
            return res, raw_txt
        except (ValidationError, ValueError, Exception) as e:
            last_err = e
            logger.warning(
                f"Attempt {attempt}/{max_retries} failed for query #{index} ('{query_line[:40]}'): {e}"
            )
            if attempt < max_retries:
                backoff = (2 ** attempt) + random.uniform(0.5, 1.5)
                logger.info(f"Retrying in {backoff:.1f} seconds...")
                time.sleep(backoff)
    
    raise RuntimeError(f"Failed query #{index} after {max_retries} attempts. Last error: {last_err}")


# --- Deduplication Logic ---

def deduplicate_all_words(queries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    word_map: Dict[str, Dict[str, Any]] = {}

    for q in queries:
        q_idx = q["index"]
        if q.get("status") != "success" or not q.get("result"):
            continue
        
        result_dict = q["result"]
        top_data = result_dict.get("top", {})
        values = top_data.get("values", [])

        for val in values:
            raw_name = val.get("n")
            if not raw_name or not isinstance(raw_name, str):
                continue
            
            clean_name = raw_name.strip()
            if not clean_name:
                continue
            
            norm_key = clean_name.lower()
            
            if norm_key not in word_map:
                word_map[norm_key] = {
                    "word": clean_name,  # Canonical name
                    "query_indices": [q_idx],
                    "y": val.get("y"),
                    "c": val.get("c", 0.5),
                    "cc": val.get("cc", 0.5),
                    "d": val.get("d", 1),
                }
            else:
                entry = word_map[norm_key]
                if q_idx not in entry["query_indices"]:
                    entry["query_indices"].append(q_idx)

    return list(word_map.values())


# --- Cache / State Management ---

def load_cache(cache_file: Path) -> Dict[str, Any]:
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load cache file ({e}). Starting fresh.")
    return {"queries": []}


def save_state(cache_file: Path, output_file: Path, state: Dict[str, Any]) -> None:
    # Deduplicate across all queries completed so far
    state["words"] = deduplicate_all_words(state.get("queries", []))
    
    # Save cache / checkpoint (retains raw_response for debugging/resuming)
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
        
    # Save final output file (clean state without raw_response to keep output dataset lean)
    clean_queries = []
    for q in state.get("queries", []):
        q_copy = dict(q)
        q_copy.pop("raw_response", None)
        clean_queries.append(q_copy)
        
    clean_output_state = {
        "queries": clean_queries,
        "words": state.get("words", [])
    }
    
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(clean_output_state, f, ensure_ascii=False, indent=2)


# --- Main Execution Workflow ---

def main():
    defaults = get_default_paths()
    
    parser = argparse.ArgumentParser(
        description="Concept Card Extender: Generate words using DeepSeek API with caching and deduplication."
    )
    parser.add_argument(
        "-p", "--prompts-file",
        type=Path,
        default=defaults["prompts_file"],
        help=f"Path to input prompts text file (default: {defaults['prompts_file']})"
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=defaults["output_file"],
        help=f"Path to final output JSON file (default: {defaults['output_file']})"
    )
    parser.add_argument(
        "-c", "--cache-file",
        type=Path,
        default=defaults["cache_file"],
        help=f"Path to cache checkpoint JSON file (default: {defaults['cache_file']})"
    )
    parser.add_argument(
        "-l", "--limit",
        type=int,
        default=None,
        help="Max number of new queries to run in this execution run"
    )
    parser.add_argument(
        "-d", "--delay",
        type=float,
        default=1.0,
        help="Delay in seconds between API queries (default: 1.0)"
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=3,
        help="Max retry attempts per query on API/Validation failure (default: 3)"
    )
    parser.add_argument(
        "--log-raw-response", "--log-raw",
        action="store_true",
        help="Log the raw LLM output text for debugging response structure"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse prompts file and show queries without calling DeepSeek API"
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Use mock responses instead of invoking live DeepSeek API"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Ignore cached results and force re-querying all prompts"
    )
    
    args = parser.parse_args()
    
    logger.info("--- Concept Card Generator Started ---")
    logger.info(f"Prompts file : {args.prompts_file}")
    logger.info(f"Output file  : {args.output}")
    logger.info(f"Cache file   : {args.cache_file}")

    # Load input prompt file dynamically
    prompts = parse_prompts_file(args.prompts_file)
    logger.info(f"Loaded {len(prompts)} valid prompt queries from file.")

    if args.dry_run:
        logger.info("[DRY RUN MODE] The following queries would be executed:")
        for idx, prompt_line in enumerate(prompts):
            print(f"  [{idx:03d}] {prompt_line}")
        logger.info("[DRY RUN COMPLETE] Exiting without API calls.")
        return

    # Load context markdown files dynamically
    guide_txt = read_text_file(defaults["guide"])
    board_txt = read_text_file(defaults["board"])
    cards_txt = read_text_file(defaults["cards"])

    # Load state/cache
    state = load_cache(args.cache_file) if not args.force else {"queries": []}
    
    # Map existing cached queries by both prompt_line text (for prompt file changes) AND index
    cached_by_prompt = {
        q["prompt_line"].strip(): q for q in state.get("queries", []) if q.get("status") == "success" and "prompt_line" in q
    }
    cached_by_idx = {
        q["index"]: q for q in state.get("queries", []) if q.get("status") == "success"
    }

    processed_count = 0
    queries_by_idx: Dict[int, Dict[str, Any]] = {}

    for idx, prompt_line in enumerate(prompts):
        clean_p = prompt_line.strip()
        
        # Check if already cached (either by prompt text match or index match with same text)
        cached_entry = None
        if not args.force:
            if clean_p in cached_by_prompt:
                cached_entry = cached_by_prompt[clean_p]
            elif idx in cached_by_idx and cached_by_idx[idx].get("prompt_line", "").strip() == clean_p:
                cached_entry = cached_by_idx[idx]

        if cached_entry:
            logger.info(f"Skipping query #{idx} (already cached and successful).")
            # Update entry index to match current file ordering
            updated_entry = dict(cached_entry)
            updated_entry["index"] = idx
            queries_by_idx[idx] = updated_entry
            continue

        if args.limit is not None and processed_count >= args.limit:
            logger.info(f"Reached execution limit of {args.limit} new queries. Stopping.")
            break

        full_prompt = build_full_prompt(guide_txt, board_txt, cards_txt, prompt_line)
        
        try:
            response, raw_txt = call_with_retry(
                prompt_str=full_prompt,
                query_line=prompt_line,
                index=idx,
                max_retries=args.max_retries,
                delay=args.delay,
                mock=args.mock,
                log_raw_response=args.log_raw_response
            )
            
            q_entry = {
                "index": idx,
                "prompt_line": prompt_line,
                "status": "success",
                "result": response.model_dump(),
                "raw_response": raw_txt
            }
            queries_by_idx[idx] = q_entry
            processed_count += 1

            # Update list and save checkpoint immediately
            state["queries"] = [queries_by_idx[i] for i in sorted(queries_by_idx.keys())]
            save_state(args.cache_file, args.output, state)
            logger.info(f"Successfully processed and cached query #{idx}.")

        except Exception as e:
            logger.error(f"Failed query #{idx}: {e}")
            q_entry = {
                "index": idx,
                "prompt_line": prompt_line,
                "status": "error",
                "error": str(e)
            }
            queries_by_idx[idx] = q_entry
            state["queries"] = [queries_by_idx[i] for i in sorted(queries_by_idx.keys())]
            save_state(args.cache_file, args.output, state)

        if args.delay > 0 and processed_count < (args.limit or len(prompts)):
            time.sleep(args.delay)

    # Final save & summary
    state["queries"] = [queries_by_idx[i] for i in sorted(queries_by_idx.keys())]
    save_state(args.cache_file, args.output, state)

    words = state.get("words", [])
    logger.info("--- Generation Finished ---")
    logger.info(f"Total queries in state : {len(state.get('queries', []))}")
    logger.info(f"Total unique words deduplicated across ALL queries : {len(words)}")


if __name__ == "__main__":
    main()
