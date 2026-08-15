#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Helper script to extract, deduplicate against existing temp_chunks and deleted_words.txt,
and prepare fresh candidate chunks from gemini3-7, gemini3-7-expr, and gemini3-7-hard.
"""

import sys
import json
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple

# Set utf-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent
RES_WORDS = ROOT_DIR / "res" / "words"
TEMP_CHUNKS_DIR = RES_WORDS / "temp_chunks"
DELETED_FILE = RES_WORDS / "deleted_words.txt"
STAGING_DIR = RES_WORDS / "staging_gemini"

sys.path.insert(0, str(ROOT_DIR))
from scripts.split_and_manage_words import (
    normalize_comparison_key,
    clean_display_title,
    remove_all_parentheticals,
    THEMES_MAP
)

# Suggested primary theme mappings for each batch query
BATCH_DEFAULT_THEMES = {
    "Culture pop": [11, 25, 44],
    "Expressions françaises": [118],
    "Expressions historiques et gourmandes": [116, 118, 22],
    "Expressions animalières": [114, 118, 6],
    "Expressions familières": [118, 45],
    "Argot": [118, 45],
    "Expressions du patrimoine": [118, 24],
    "vocabulaire avancé": [13, 9],
    "vocabulaire riche": [13, 9],
    "Vocabulaire soutenu": [13, 9, 25]
}


def prepare_staging_chunks(chunk_size: int = 250):
    print("🚀 Initializing Gemini Candidates Staging...")
    
    # 1. Load existing keys from temp_chunks
    existing_keys: Dict[str, Tuple[str, str]] = {}
    for cf in sorted(TEMP_CHUNKS_DIR.glob("chunk_*.json")):
        with open(cf, "r", encoding="utf-8") as f:
            cdata = json.load(f)
        for w in cdata.get("words", []):
            k = normalize_comparison_key(w["word"])
            existing_keys[k] = (w["word"], cf.name)
    print(f"📦 Loaded {len(existing_keys)} existing keys from temp_chunks.")

    # 2. Load deleted words
    deleted_keys: Set[str] = set()
    if DELETED_FILE.exists():
        with open(DELETED_FILE, "r", encoding="utf-8") as f:
            for line in f:
                l_str = line.strip()
                if l_str:
                    deleted_keys.add(normalize_comparison_key(l_str))
    print(f"🗑️ Loaded {len(deleted_keys)} deleted keys from deleted_words.txt.")

    # 3. Read all raw batch files
    batch_folders = ["gemini3-7", "gemini3-7-expr", "gemini3-7-hard"]
    raw_entries = []
    
    for bf in batch_folders:
        for f in sorted((RES_WORDS / bf).glob("*.json")):
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
            top = data.get("top", {})
            subject = top.get("subject", "")
            query = top.get("query", "")
            vals = top.get("values", [])
            for v in vals:
                raw_entries.append({
                    "batch": bf,
                    "file": f.name,
                    "subject": subject,
                    "query": query,
                    "item": v
                })
    print(f"📄 Scanned {len(raw_entries)} raw entries across all 23 batch files.")

    # 4. Filter & Deduplicate
    candidates = []
    seen_candidate_keys = set()
    skipped_existing = 0
    skipped_deleted = 0
    skipped_dup = 0

    for entry in raw_entries:
        item = entry["item"]
        raw_name = item.get("n", "").strip()
        if not raw_name:
            continue

        clean_name = clean_display_title(raw_name)
        k = normalize_comparison_key(clean_name)
        if not k:
            continue

        if k in existing_keys:
            skipped_existing += 1
            continue
        if k in deleted_keys:
            skipped_deleted += 1
            continue
        if k in seen_candidate_keys:
            skipped_dup += 1
            continue

        seen_candidate_keys.add(k)
        
        # Clean year: convert 0 or invalid to None
        y = item.get("y")
        if y == 0 or y is None:
            y = None
        else:
            try:
                y = int(y)
            except (ValueError, TypeError):
                y = None

        # Clean scores
        c = round(float(item.get("c", 0.5)), 2)
        cc = round(float(item.get("cc", 0.5)), 2)
        d = int(item.get("d", 1))
        if d not in (0, 1, 2):
            d = 1

        # Determine initial default query_indices based on batch/subject
        q_indices = [118] if "expr" in entry["batch"] or "expression" in entry["subject"].lower() else [13]
        if "hard" in entry["batch"]:
            q_indices = [13, 9]

        candidates.append({
            "word": clean_name,
            "query_indices": q_indices,
            "y": y,
            "c": c,
            "cc": cc,
            "d": d,
            "_meta": {
                "source_batch": f"{entry['batch']}/{entry['file']}",
                "raw_subject": entry["subject"]
            }
        })

    print(f"\n📊 Filtering Results:")
    print(f"   • Skipped (Already in temp_chunks): {skipped_existing}")
    print(f"   • Skipped (In deleted_words.txt): {skipped_deleted}")
    print(f"   • Skipped (Duplicate within batches): {skipped_dup}")
    print(f"   • 🌟 Total Fresh Candidates to Curate: {len(candidates)}")

    # 5. Partition into staging files
    STAGING_DIR.mkdir(parents=True, exist_ok=True)
    chunks = [candidates[i:i + chunk_size] for i in range(0, len(candidates), chunk_size)]
    
    print(f"\n📦 Writing {len(chunks)} staging chunks to: {STAGING_DIR}")
    for idx, ch in enumerate(chunks, start=1):
        st_file = STAGING_DIR / f"staging_{idx:03d}.json"
        payload = {
            "staging_id": idx,
            "total_staging_files": len(chunks),
            "count": len(ch),
            "words": ch
        }
        with open(st_file, "w", encoding="utf-8") as out_fp:
            json.dump(payload, out_fp, ensure_ascii=False, indent=2)
        print(f"   • Created {st_file.name} ({len(ch)} candidates)")

    manifest = {
        "total_fresh_candidates": len(candidates),
        "chunk_size": chunk_size,
        "staging_files_count": len(chunks),
        "files": [f"staging_{i:03d}.json" for i in range(1, len(chunks) + 1)]
    }
    with open(STAGING_DIR / "staging_manifest.json", "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, ensure_ascii=False, indent=2)

    print(f"✅ Staging ready in '{STAGING_DIR}'.")


if __name__ == "__main__":
    prepare_staging_chunks(chunk_size=220)
