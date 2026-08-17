import json
import subprocess
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
WEB_PUBLIC_DIR = ROOT_DIR / "web" / "public"
OUTPUT_FILE = WEB_PUBLIC_DIR / "app-version.json"
WORDS_FILE = ROOT_DIR / "res" / "words.json"

def get_git_hash() -> str:
    try:
        res = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
            check=True
        )
        return res.stdout.strip()
    except Exception:
        return hex(int(time.time()))[2:10]

def get_dataset_info():
    dataset_version = 2
    words_count = 6175
    if WORDS_FILE.exists():
        try:
            with open(WORDS_FILE, "r", encoding="utf-8") as f:
                d = json.load(f)
                dataset_version = d.get("version", 2)
                words_count = d.get("count", len(d.get("words", [])))
        except Exception as e:
            print(f"Notice reading dataset: {e}")
    return dataset_version, words_count

def generate_version():
    git_hash = get_git_hash()
    ds_version, count = get_dataset_info()
    built_at = int(time.time() * 1000)

    version_data = {
        "appVersion": "1.2.0",
        "buildHash": git_hash,
        "builtAt": built_at,
        "datasetVersion": ds_version,
        "wordsCount": count
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(version_data, f, ensure_ascii=False, indent=2)

    print(f"[Version] Generated {OUTPUT_FILE} (buildHash: {git_hash}, datasetVersion: {ds_version}, words: {count})")

if __name__ == "__main__":
    generate_version()
