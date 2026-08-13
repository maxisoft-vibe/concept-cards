import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
RES_DIR = ROOT_DIR / "res"
WORDS_FILE = RES_DIR / "words_generated.json"
OUTPUT_FILE = RES_DIR / "words_compact.json"

def clean_theme_title(prompt_line: str) -> str:
    s = prompt_line.strip()
    if s.lower().startswith("top 50 d'"):
        s = s[9:]
    elif s.lower().startswith("top 50 de "):
        s = s[10:]
    elif s.lower().startswith("top 50 des "):
        s = s[11:]
    elif s.lower().startswith("top 50 du "):
        s = s[10:]
    elif s.lower().startswith("top 50 "):
        s = s[7:]
    
    if s:
        s = s[0].upper() + s[1:]
    if "." in s:
        s = s.split(".")[0].strip()
    return s

def prepare_compact_data():
    print(f"Reading {WORDS_FILE}...")
    with open(WORDS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    queries = data.get("queries", [])
    words = data.get("words", [])
    
    # Map of query index -> clean subject/theme title
    themes = {}
    for q in queries:
        idx = q.get("index")
        prompt = q.get("prompt_line", "")
        subject = None
        if "result" in q and isinstance(q["result"], dict):
            top_obj = q["result"].get("top", {})
            subject = top_obj.get("subject")
        
        if not subject:
            subject = clean_theme_title(prompt)
        themes[idx] = subject
        
    print(f"Processed {len(themes)} themes.")
    
    # Process words: optimize structure
    compact_words = []
    for w in words:
        word_text = w.get("word", "").strip()
        if not word_text:
            continue
        
        d = w.get("d", 1)  # 0, 1, 2
        q_indices = w.get("query_indices", [])
        y = w.get("y")
        c = round(w.get("c", 0.5), 2) if w.get("c") is not None else None
        cc = round(w.get("cc", 0.5), 2) if w.get("cc") is not None else None
        
        item = {
            "w": word_text,
            "d": d,
            "q": q_indices
        }
        if y is not None:
            item["y"] = y
        if c is not None and c != 0.5:
            item["c"] = c
        if cc is not None and cc != 0.5:
            item["cc"] = cc
            
        compact_words.append(item)
    
    compact_payload = {
        "version": 1,
        "count": len(compact_words),
        "themes": themes,
        "words": compact_words
    }
    
    print(f"Writing {len(compact_words)} compact words to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(compact_payload, f, ensure_ascii=False, separators=(',', ':'))
        
    orig_size = WORDS_FILE.stat().st_size
    new_size = OUTPUT_FILE.stat().st_size
    print(f"Original size: {orig_size / (1024*1024):.2f} MB")
    print(f"Compact size: {new_size / (1024*1024):.2f} MB (Reduction: {(1 - new_size/orig_size)*100:.1f}%)")

if __name__ == "__main__":
    prepare_compact_data()
