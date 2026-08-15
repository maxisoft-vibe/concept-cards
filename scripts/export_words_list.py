#!/usr/bin/env python3
"""
Extract all words from chunks into a plain text file (one word per line).
"""

import json
import sys
from pathlib import Path

# Ensure UTF-8 output even on Windows console
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

def export_words(chunks_dir: Path, output_file: Path):
    chunk_files = sorted(chunks_dir.glob("chunk_*.json"))
    if not chunk_files:
        print(f"[!] Aucun fichier chunk_*.json trouvé dans {chunks_dir}")
        return

    words = []
    for f in chunk_files:
        with open(f, "r", encoding="utf-8") as fp:
            data = json.load(fp)
            for item in data.get("words", []):
                w = item.get("word", "").strip()
                if w:
                    words.append(w)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as out:
        for w in words:
            out.write(f"{w}\n")

    print(f"[+] {len(words)} mots exportes avec succes depuis {len(chunk_files)} chunks vers :\n    {output_file.resolve()}")

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    chunks_path = base_dir / "res" / "words" / "temp_chunks"
    output_path = base_dir / "res" / "words" / "words_list.txt"
    export_words(chunks_path, output_path)
