#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Concept Words Dataset Manager & Splitter
=========================================
Handles intelligent, safe, UTF-8 compliant word normalization, duplicate detection,
splitting of `words_generated.json` into manageable chunk files for subagents,
and merging/validating curated chunks.
"""

import os
import sys
import json
import re
import shutil
import unicodedata
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Set

# Ensure UTF-8 stdout/stderr on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Root directory resolution
ROOT_DIR = Path(__file__).resolve().parent.parent
RES_DIR = ROOT_DIR / "res"
DEFAULT_SOURCE = RES_DIR / "words_generated.json"
DEFAULT_CHUNKS_DIR = RES_DIR / "words" / "temp_chunks"

# Official 170 Themes Mapping (0 to 169)
THEMES_MAP: Dict[int, str] = {
    0: "objets, paquets et conteneurs",
    1: "Famille, société, groupes",
    2: "Femmes, féminité et genre féminin",
    3: "Masculinité et références masculines",
    4: "Travail, métiers et professions",
    5: "Sports & Loisirs",
    6: "faune, monde animal et créatures",
    7: "Flore, plantes et nature végétale",
    8: "musique, chansons et sonorités",
    9: "Littérature, écriture et livres",
    10: "art visuel, peinture, sculpture, bande dessinée",
    11: "Cinéma et films",
    12: "Télévision, séries et émissions",
    13: "idées, pensée, création, concept",
    14: "Géographie et culture mondiale",
    15: "Temps historique, dates, fêtes et événements",
    16: "Mer et navigation",
    17: "Ciel, aviation, vol",
    18: "Automobile et route",
    19: "Outils, bricolage et construction",
    20: "mode, vêtements et costumes",
    21: "Jeux, jouets et ludique",
    22: "Nourriture et gastronomie",
    23: "maison, habitat, foyer",
    24: "Réel et Histoire",
    25: "Fiction, imaginaire, fantastique, merveilleux",
    26: "Enfance, jeunesse, nouveauté",
    27: "old age, adults, past, antiquity",
    28: "Lenteur, patience et tortue",
    29: "Vitesse et rapidité",
    30: "Conflit, guerre, armes, combat",
    31: "Défense et protection",
    32: "Mort, Mal, Maladie et Tragédie",
    33: "Vie, Amour, Cœur, Affection",
    34: "Joie, bonheur, sourire, positivité",
    35: "tristesse et mélancolie",
    36: "Mechanics, Industry and Gears",
    37: "Informatique, électronique et technologie",
    38: "Money & Wealth",
    39: "Temps et horlogerie",
    40: "pouvoir, politique, royauté, gouvernement",
    41: "religion, mythes, spiritualité, croyances",
    42: "Sciences, chimie, physique, mathématiques",
    43: "Médecine, santé, guérison et soins",
    44: "Titres, marques, noms et notoriété",
    45: "dialogue, parole, expression, citations",
    46: "tête et visage",
    47: "Mains, Bras, Toucher",
    48: "corps, torse, ventre, anatomie",
    49: "legs/feet/walking",
    50: "oreille, son, écoute, ouïe",
    51: "Nez, odeurs, parfums, olfaction",
    52: "l'œil, le regard, la vue et l'observation",
    53: "mouth, lips, taste and tasting",
    54: "météo et froid",
    55: "Éclair, tempête, électricité, colère",
    56: "Nuit, soir, lune, obscurité",
    57: "sun_heat_light_day",
    58: "Feu et flamme",
    59: "eau, liquides, monde aquatique",
    60: "Air, Vent, Souffle, Atmosphère",
    61: "Terre, sol, monde souterrain",
    62: "Roche, minéraux, pierres, dureté",
    63: "Bois, arbres et forêt",
    64: "Metal, metallurgie, alliages",
    65: "Tissus, textile et couture",
    66: "plastique, caoutchouc, matières synthétiques",
    67: "papier, feuilles, imprimerie",
    68: "Opposition, contraire, inverse, contraste",
    69: "Couper, séparer, diviser, trancher",
    70: "fragments, multitude, powder, scattering",
    71: "parties et morceaux",
    72: "Intérieur, contenu, inclusion",
    73: "prison, grilles, enfermement, captivité",
    74: "Zéro, néant, vide, absence",
    75: "Unité et singularité",
    76: "Ligne droite, droiture, rectitude",
    77: "Courbe, arc, rondeur, flexion",
    78: "Croix, croisement, intersection",
    79: "lignes brisées, pointu, accidenté, brisé",
    80: "spirale, folie, ivresse, vertige",
    81: "Vagues, ondulations, sinusoïde",
    82: "Cercle, rond, ring, anneau",
    83: "étoiles, astronomie, célébrité",
    84: "Triangle, Trinité, Trois",
    85: "flatness, flat surfaces, smoothness",
    86: "squares, rectangles and grids",
    87: "spheres, balls and globes",
    88: "Cube, block and paving stone references",
    89: "Pyramides et structures pyramidales",
    90: "cylindre, tube, rouleaux",
    91: "Cône, entonnoir et formes coniques",
    92: "creux, trou, perforation, cavité",
    93: "grandeur et hauteur",
    94: "petitesse, nain, miniature",
    95: "largeur, grosseur, étalement",
    96: "finesse, minceur, étroit, court",
    97: "Hauteur, élévation, monter",
    98: "bassesse, bas, descendre",
    99: "lateralite et temporalite",
    100: "rotation, cycles, tours, mouvement circulaire",
    101: "Action et verbe",
    102: "Rouge",
    103: "Éléments liés à la couleur orange",
    104: "couleur jaune",
    105: "Couleur verte",
    106: "Bleu",
    107: "Éléments mauves et violets",
    108: "couleur rose",
    109: "couleur brune/marron",
    110: "couleur noire",
    111: "Gris",
    112: "La couleur blanche dans la culture, les expressions, la nature et les minéraux.",
    113: "transparence invisibilité verre",
    114: "Expressions et proverbes avec des animaux",
    115: "Expressions et métaphores avec parties du corps",
    116: "Expressions et proverbes culinaires",
    117: "Expressions météo et éléments",
    118: "Proverbes et adages",
    119: "Intelligence Artificielle, Robots, Automates",
    120: "Réseaux sociaux, culture web et viralité",
    121: "Cyberespace, cybersécurité, piratage",
    122: "Conquête spatiale moderne & New Space",
    123: "Véhicules écologiques et mobilité moderne",
    124: "jeu vidéo, e-sport, streaming",
    125: "clichés et tropes du cinéma/séries",
    126: "Memes Internet et culture web",
    127: "Objets technologiques et gadgets nostalgiques des années 90-2000",
    128: "super-pouvoirs, capacités surhumaines, mutations",
    129: "mythes, légendes urbaines et grands mystères populaires",
    130: "voyage temporel / boucles spatio-temporelles",
    131: "Véhicules fantastiques de fiction",
    132: "Belgicismes et expressions belges",
    133: "expressions québécoises",
    134: "Expressions africaines et nouchi ivoirien",
    135: "Expressions québécoises et canadiennes sur le froid, la météo et la neige",
    136: "Expressions belges conviviales, festives et culinaires",
    137: "Expressions africaines (relations/fête)",
    138: "expressions maghrébines en français",
    139: "Interjections et jurons doux",
    140: "faux-amis francophones",
    141: "œuvres cultes avec boucle temporelle et humour",
    142: "amour homme-machine",
    143: "Nourriture mortelle et historique",
    144: "sports et loisirs absurdes",
    145: "Personnages et super-héros culinaires humoristiques",
    146: "Expressions animalières culinaires",
    147: "Morts absurdes de dirigeants",
    148: "Jouets et objets inanimés qui prennent vie dans les films et séries",
    149: "créatures marines légendaires et vaisseaux fantômes",
    150: "chansons et clips cultes avec pluie et mélancolie",
    151: "disparitions aériennes mystérieuses",
    152: "Gadgets vestimentaires fictifs",
    153: "Lieux et monuments fictifs effrayants ou liés à la sorcellerie",
    154: "Animaux venimeux ou dangereux aux couleurs vives (rouge/jaune)",
    155: "Jeux vidéo de guerre historiques",
    156: "remèdes et potions magiques",
    157: "Épisodes de séries avec comédie musicale",
    158: "Braquages et évasions réels",
    159: "expressions de bug et de redémarrage",
    160: "phrases anodines à double sens",
    161: "travers et rituels de la vie en communauté",
    162: "Métaphores de chimie, boissons et potions quotidiennes",
    163: "Expressions de bricolage et rénovation pour l'état mental",
    164: "expressions imagées repos forcé et calme imposé",
    165: "expressions météo émotionnelle",
    166: "déconnexion et isolement",
    167: "jargon de bureau et management détourné",
    168: "extreme zen / humorous apathy",
    169: "métaphores de la vie réelle"
}


# ==============================================================================
# 🔤 UNICODE & TEXT NORMALIZATION ENGINE
# ==============================================================================

def strip_accents(s: str) -> str:
    """Removes all diacritical marks/accents while preserving base characters."""
    normalized = unicodedata.normalize("NFD", s)
    return "".join(c for c in normalized if unicodedata.category(c) != "Mn")


def clean_display_title(s: str) -> str:
    """
    Standardizes display title formatting:
    - Normalizes Unicode (NFKC)
    - Normalizes typography (curly quotes, dashes, non-breaking spaces)
    - Trims redundant spaces and bounding quotes
    """
    if not s:
        return ""
    
    # Unicode NFKC
    s = unicodedata.normalize("NFKC", s)
    
    # Normalize typography
    s = s.replace("’", "'").replace("‘", "'").replace("`", "'").replace("´", "'").replace("ʼ", "'")
    s = s.replace("«", '"').replace("»", '"').replace("“", '"').replace("”", '"')
    s = s.replace("—", "-").replace("–", "-").replace("−", "-")
    s = s.replace("\u00a0", " ").replace("\u202f", " ").replace("\u200b", "")
    
    # Strip unnecessary outer quotes
    s = s.strip()
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        if len(s) >= 2:
            s = s[1:-1].strip()
            
    # Collapse multiple whitespaces
    s = re.sub(r"\s+", " ", s).strip()
    return s


def remove_all_parentheticals(s: str) -> str:
    """
    Removes any text enclosed in parentheses (...), brackets [...], or curly braces {...}
    anywhere in the string (e.g. 'Brainstorming (sur la couleur des mugs)' -> 'Brainstorming',
    'L\'habit ne fait pas le moine (doublon?)' -> 'L\'habit ne fait pas le moine').
    """
    s = re.sub(r"\([^)]*\)", " ", s)
    s = re.sub(r"\[[^\]]*\]", " ", s)
    s = re.sub(r"\{[^}]*\}", " ", s)
    # Also clean unclosed trailing parenthesis if present
    s = re.sub(r"\s*\([^)]*$", "", s)
    return re.sub(r"\s+", " ", s).strip()


def strip_parenthetical_annotations(s: str) -> Tuple[str, Optional[str]]:
    """
    Extracts trailing parenthetical clarifications if present.
    """
    match = re.search(r"\s*\(([^)]+)\)\s*$", s)
    if match:
        note = match.group(1).strip()
        cleaned = s[:match.start()].strip()
        return cleaned, note
    return s, None


def strip_leading_articles(s: str) -> Tuple[str, Optional[str]]:
    """
    Detects and strips French and English leading articles for comparison or cleanup:
    e.g. 'Le chat' -> ('chat', 'Le')
         'L\'arbre' -> ('arbre', 'L\'')
    """
    pattern = r"^(l['’]\s*|d['’]\s*|de\s+l['’]\s*|le\s+|la\s+|les\s+|un\s+|une\s+|des\s+|du\s+|de\s+la\s+|the\s+|a\s+|an\s+)"
    match = re.match(pattern, s, flags=re.IGNORECASE)
    if match:
        art = match.group(1)
        cleaned = s[match.end():].strip()
        return cleaned, art
    return s, None


def normalize_comparison_key(s: str, strip_articles: bool = True) -> str:
    """
    Generates a canonical, deterministic alphanumeric key for collision and duplicate checking.
    - Cleans display title
    - Strips ALL parenthetical content anywhere in the string
    - Optionally strips leading articles
    - Strips accents and diacritics
    - Converts to lowercase
    - Retains only [a-z0-9]
    """
    s = clean_display_title(s)
    s = remove_all_parentheticals(s)
    if strip_articles:
        s, _ = strip_leading_articles(s)
    s = strip_accents(s.lower())
    s = re.sub(r"[^a-z0-9]", "", s)
    return s


# ==============================================================================
# 📦 CHUNK SPLITTER & MERGER ENGINE
# ==============================================================================

def split_words_dataset(source_path: Path, output_dir: Path, chunk_size: int = 256) -> Dict[str, Any]:
    """
    Splits `words_generated.json` into chunks of specified size in `output_dir`.
    """
    print(f"📖 Reading source dataset from: {source_path}")
    if not source_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path}")

    with open(source_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    words = data.get("words", [])
    queries = data.get("queries", [])
    total_words = len(words)
    print(f"✅ Found {total_words:,} words and {len(queries)} queries.")

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    # Compute chunk partitioning
    chunks = [words[i:i + chunk_size] for i in range(0, total_words, chunk_size)]
    total_chunks = len(chunks)

    print(f"📦 Splitting into {total_chunks} chunks of ~{chunk_size} words...")

    chunk_manifest = {
        "source_file": str(source_path.relative_to(ROOT_DIR) if source_path.is_relative_to(ROOT_DIR) else source_path),
        "total_words": total_words,
        "chunk_size": chunk_size,
        "total_chunks": total_chunks,
        "themes_count": len(THEMES_MAP),
        "themes": THEMES_MAP,
        "chunks": []
    }

    for idx, chunk_words in enumerate(chunks, start=1):
        chunk_file_name = f"chunk_{idx:03d}.json"
        chunk_file_path = output_dir / chunk_file_name

        # Clean display titles in chunk
        cleaned_words = []
        for w in chunk_words:
            w_copy = dict(w)
            w_copy["word"] = clean_display_title(w_copy.get("word", ""))
            # Ensure query_indices is a sorted list of ints
            q_indices = sorted(list(set(int(x) for x in w_copy.get("query_indices", []) if 0 <= int(x) <= 169)))
            w_copy["query_indices"] = q_indices
            cleaned_words.append(w_copy)

        chunk_payload = {
            "chunk_id": idx,
            "total_chunks": total_chunks,
            "count": len(cleaned_words),
            "words": cleaned_words
        }

        with open(chunk_file_path, "w", encoding="utf-8") as cf:
            json.dump(chunk_payload, cf, ensure_ascii=False, indent=2)

        chunk_manifest["chunks"].append({
            "chunk_id": idx,
            "file": chunk_file_name,
            "count": len(cleaned_words),
            "first_word": cleaned_words[0]["word"] if cleaned_words else "",
            "last_word": cleaned_words[-1]["word"] if cleaned_words else ""
        })

    # Save manifest
    manifest_path = output_dir / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as mf:
        json.dump(chunk_manifest, mf, ensure_ascii=False, indent=2)

    print(f"🎉 Successfully created {total_chunks} chunk files and manifest in: {output_dir}")
    return chunk_manifest


def validate_chunk_files(chunks_dir: Path) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Validates all chunk files in `chunks_dir` against game schema and consistency rules.
    """
    print(f"🔍 Validating chunks in: {chunks_dir}")
    if not chunks_dir.exists():
        return False, [f"Directory does not exist: {chunks_dir}"], {}

    chunk_files = sorted(chunks_dir.glob("chunk_*.json"))
    if not chunk_files:
        return False, [f"No chunk_*.json files found in {chunks_dir}"], {}

    errors = []
    seen_keys: Dict[str, Tuple[str, str]] = {}  # key -> (word, chunk_file)
    duplicate_warnings = []
    
    total_valid_words = 0
    diff_counts = {0: 0, 1: 0, 2: 0}

    for cfile in chunk_files:
        try:
            with open(cfile, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            errors.append(f"[{cfile.name}] JSON decode error: {e}")
            continue

        words = data.get("words", [])
        if not isinstance(words, list):
            errors.append(f"[{cfile.name}] 'words' must be a list")
            continue

        for i, item in enumerate(words):
            if not isinstance(item, dict):
                errors.append(f"[{cfile.name} item #{i}] entry must be an object")
                continue

            word_str = item.get("word")
            if not word_str or not isinstance(word_str, str) or not word_str.strip():
                errors.append(f"[{cfile.name} item #{i}] missing or empty 'word'")
                continue

            # Check difficulty 'd'
            d = item.get("d")
            if d not in (0, 1, 2):
                errors.append(f"[{cfile.name} item '{word_str}'] invalid difficulty d={d} (must be 0, 1, or 2)")
            else:
                diff_counts[d] += 1

            # Check complexity 'c' & commonness 'cc'
            for score_key in ("c", "cc"):
                val = item.get(score_key)
                if val is not None and (not isinstance(val, (int, float)) or not (0.0 <= val <= 1.0)):
                    errors.append(f"[{cfile.name} item '{word_str}'] invalid {score_key}={val} (must be float [0.0..1.0])")

            # Check query_indices
            q_indices = item.get("query_indices", [])
            if not isinstance(q_indices, list):
                errors.append(f"[{cfile.name} item '{word_str}'] 'query_indices' must be a list")
            else:
                for q in q_indices:
                    if not isinstance(q, int) or not (0 <= q <= 169):
                        errors.append(f"[{cfile.name} item '{word_str}'] query index {q} is out of bounds [0..169]")

            # Check duplicate collisions
            comp_key = normalize_comparison_key(word_str)
            if comp_key in seen_keys:
                orig_word, orig_file = seen_keys[comp_key]
                duplicate_warnings.append(
                    f"Duplicate key '{comp_key}': '{word_str}' ({cfile.name}) collides with '{orig_word}' ({orig_file})"
                )
            else:
                seen_keys[comp_key] = (word_str, cfile.name)

            total_valid_words += 1

    stats = {
        "total_chunk_files": len(chunk_files),
        "total_words": total_valid_words,
        "unique_keys": len(seen_keys),
        "duplicate_count": len(duplicate_warnings),
        "difficulty_distribution": {
            "easy_0": diff_counts[0],
            "medium_1": diff_counts[1],
            "hard_2": diff_counts[2]
        }
    }

    is_valid = len(errors) == 0
    print(f"📊 Validation Summary: {'✅ PASSED' if is_valid else '❌ FAILED'}")
    print(f"   - Total Words: {total_valid_words:,}")
    print(f"   - Unique Canonical Keys: {len(seen_keys):,}")
    print(f"   - Near-duplicate Collisions: {len(duplicate_warnings):,}")
    print(f"   - Difficulty: Easy={diff_counts[0]:,} | Med={diff_counts[1]:,} | Hard={diff_counts[2]:,}")
    
    if duplicate_warnings:
        print(f"\n⚠️ Sample Near-Duplicate Collisions ({min(10, len(duplicate_warnings))} of {len(duplicate_warnings)}):")
        for w in duplicate_warnings[:10]:
            print(f"   • {w}")

    if errors:
        print(f"\n❌ Validation Errors ({len(errors)}):")
        for err in errors[:20]:
            print(f"   • {err}")

    return is_valid, errors, stats


def find_duplicates_in_dataset(source_path: Path) -> List[Dict[str, Any]]:
    """
    Finds all exact and near-duplicate word entries in a dataset file.
    """
    with open(source_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    words = data.get("words", [])
    key_map: Dict[str, List[Dict[str, Any]]] = {}

    for item in words:
        raw_word = item.get("word", "")
        key = normalize_comparison_key(raw_word)
        if key not in key_map:
            key_map[key] = []
        key_map[key].append(item)

    duplicate_groups = []
    for key, group in key_map.items():
        if len(group) > 1:
            duplicate_groups.append({
                "key": key,
                "count": len(group),
                "words": [g.get("word") for g in group],
                "all_query_indices": sorted(list(set(q for g in group for q in g.get("query_indices", [])))),
                "entries": group
            })

    print(f"🔍 Scanned {len(words):,} words. Found {len(duplicate_groups):,} duplicate groups.")
    return duplicate_groups


def merge_chunks_to_master(
    chunks_dir: Path,
    original_file: Path = DEFAULT_SOURCE,
    output_file: Optional[Path] = None,
    backup: bool = True
) -> Dict[str, Any]:
    """
    Merges curated chunks back into a master `words_generated.json` file.
    Preserves original `queries` metadata and seamlessly merges `words`.
    """
    if output_file is None:
        output_file = original_file

    print(f"🔄 Merging chunks from '{chunks_dir}' into '{output_file}'...")
    
    chunk_files = sorted(chunks_dir.glob("chunk_*.json"))
    if not chunk_files:
        raise FileNotFoundError(f"No chunk_*.json files found in {chunks_dir}")

    # Read original queries
    original_queries = []
    if original_file.exists():
        with open(original_file, "r", encoding="utf-8") as f:
            orig_data = json.load(f)
            original_queries = orig_data.get("queries", [])

    merged_words_map: Dict[str, Dict[str, Any]] = {}
    dedup_merged_count = 0

    for cfile in chunk_files:
        with open(cfile, "r", encoding="utf-8") as f:
            cdata = json.load(f)

        for item in cdata.get("words", []):
            word_str = clean_display_title(item.get("word", ""))
            if not word_str:
                continue

            q_indices = item.get("query_indices", [])
            clean_q_indices = []
            seen_q = set()
            for q in q_indices:
                try:
                    qi = int(q)
                    if 0 <= qi <= 169 and qi not in seen_q:
                        clean_q_indices.append(qi)
                        seen_q.add(qi)
                except (ValueError, TypeError):
                    pass

            comp_key = normalize_comparison_key(word_str)
            if comp_key in merged_words_map:
                # Merge existing entry
                existing = merged_words_map[comp_key]
                for qi in clean_q_indices:
                    if qi not in existing["query_indices"]:
                        existing["query_indices"].append(qi)
                
                # Keep the more informative year if available
                if existing.get("y") is None and item.get("y") is not None:
                    existing["y"] = item.get("y")
                    
                dedup_merged_count += 1
            else:
                merged_words_map[comp_key] = {
                    "word": word_str,
                    "query_indices": clean_q_indices,
                    "y": item.get("y"),
                    "c": round(item.get("c", 0.5), 2) if item.get("c") is not None else 0.5,
                    "cc": round(item.get("cc", 0.5), 2) if item.get("cc") is not None else 0.5,
                    "d": int(item.get("d", 1))
                }

    final_words_list = list(merged_words_map.values())
    
    # Sort alphabetically by clean title
    final_words_list.sort(key=lambda x: strip_accents(x["word"].lower()))

    master_payload = {
        "queries": original_queries,
        "words": final_words_list
    }

    # Backup if modifying original
    if backup and output_file.exists():
        backup_path = output_file.with_suffix(".json.bak")
        print(f"💾 Backing up existing master file to: {backup_path}")
        shutil.copy2(output_file, backup_path)

    print(f"✍️ Writing {len(final_words_list):,} consolidated words to: {output_file}")
    with open(output_file, "w", encoding="utf-8") as out_f:
        json.dump(master_payload, out_f, ensure_ascii=False, indent=2)

    summary = {
        "total_source_chunks": len(chunk_files),
        "total_merged_words": len(final_words_list),
        "deduplicated_mergers": dedup_merged_count,
        "output_file": str(output_file)
    }
    print(f"🎉 Merge complete! Final unique word count: {len(final_words_list):,}")
    return summary


def search_word_cli(query: str, target_dir_or_file: Path) -> List[Dict[str, Any]]:
    """
    Searches for a word in chunks or master dataset using normalization key and substring matching.
    """
    search_key = normalize_comparison_key(query)
    clean_q = clean_display_title(query).lower()
    matches = []

    if target_dir_or_file.is_file():
        files = [target_dir_or_file]
    else:
        files = sorted(target_dir_or_file.glob("chunk_*.json"))
        if not files:
            files = [DEFAULT_SOURCE]

    for fpath in files:
        if not fpath.exists():
            continue
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            words = data.get("words", [])
            for w in words:
                w_title = w.get("word", "")
                w_key = normalize_comparison_key(w_title)
                if search_key == w_key or clean_q in w_title.lower():
                    matches.append({
                        "file": fpath.name,
                        "word": w_title,
                        "key": w_key,
                        "d": w.get("d"),
                        "query_indices": w.get("query_indices", []),
                        "themes": [THEMES_MAP.get(idx, f"Theme #{idx}") for idx in w.get("query_indices", [])]
                    })

    print(f"🔎 Found {len(matches)} match(es) for query '{query}':")
    for m in matches[:20]:
        print(f"   • [{m['file']}] '{m['word']}' (d={m['d']}) -> Themes: {m['query_indices']} ({', '.join(m['themes'][:3])})")
    return matches


# ==============================================================================
# 🚀 CLI ENTRYPOINT
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="Concept Card Extender - Word Dataset Manager & Splitter")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Split command
    split_p = subparsers.add_parser("split", help="Split words_generated.json into chunks")
    split_p.add_argument("--source", type=Path, default=DEFAULT_SOURCE, help="Source JSON file path")
    split_p.add_argument("--output-dir", type=Path, default=DEFAULT_CHUNKS_DIR, help="Destination directory for chunks")
    split_p.add_argument("--chunk-size", type=int, default=256, help="Number of words per chunk (e.g. 128 or 256)")

    # Validate command
    val_p = subparsers.add_parser("validate", help="Validate chunk files or dataset")
    val_p.add_argument("--dir", type=Path, default=DEFAULT_CHUNKS_DIR, help="Directory containing chunk files")

    # Duplicates command
    dup_p = subparsers.add_parser("find-duplicates", help="Find near-duplicates in dataset")
    dup_p.add_argument("--source", type=Path, default=DEFAULT_SOURCE, help="Source dataset file")

    # Search command
    search_p = subparsers.add_parser("search", help="Search for a word in dataset or chunks")
    search_p.add_argument("query", type=str, help="Word or expression to search")
    search_p.add_argument("--path", type=Path, default=DEFAULT_CHUNKS_DIR, help="Chunks directory or dataset file")

    # Merge command
    merge_p = subparsers.add_parser("merge", help="Merge chunks back into master dataset")
    merge_p.add_argument("--chunks-dir", type=Path, default=DEFAULT_CHUNKS_DIR, help="Directory containing curated chunks")
    merge_p.add_argument("--output", type=Path, default=DEFAULT_SOURCE, help="Target master file")
    merge_p.add_argument("--no-backup", action="store_true", help="Skip creating backup file")

    args = parser.parse_args()

    if args.command == "split":
        split_words_dataset(args.source, args.output_dir, args.chunk_size)
    elif args.command == "validate":
        validate_chunk_files(args.dir)
    elif args.command == "find-duplicates":
        find_duplicates_in_dataset(args.source)
    elif args.command == "search":
        search_word_cli(args.query, args.path)
    elif args.command == "merge":
        merge_chunks_to_master(args.chunks_dir, DEFAULT_SOURCE, args.output, backup=not args.no_backup)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
