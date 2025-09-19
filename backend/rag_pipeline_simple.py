import os
from pathlib import Path


def load_resources(base_dir: str) -> dict:
    resources_dir = Path(base_dir)
    files_content = {}
    if not resources_dir.exists():
        return files_content
    for path in resources_dir.rglob("*.md"):
        try:
            files_content[str(path)] = path.read_text(encoding="utf-8")
        except Exception:
            continue
    return files_content


def keyword_search(query: str, corpus: dict, top_k: int = 3):
    q = query.lower()
    scored = []
    for path, content in corpus.items():
        text = content.lower()
        score = sum(q.count(word) for word in set(q.split()) if word in text)
        if score > 0:
            snippet = content[:500]
            scored.append((score, path, snippet))
    scored.sort(reverse=True, key=lambda x: x[0])
    return scored[:top_k]


def build_prompt(query: str, contexts):
    joined = "\n\n".join([f"Source: {p}\nSnippet:\n{snip}" for _, p, snip in contexts])
    return f"You are a helpful assistant. Use the provided context to answer. If the answer is not in the context, say you don't know.\n\nContext:\n{joined}\n\nQuestion: {query}\nAnswer:"


def generate_with_gemini(prompt: str) -> str:
    # Placeholder for Google Gemini API call. Use the API key from env.
    # Implement actual call later. For now, echo a stub.
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY", "")
    if not api_key:
        return "[Gemini API key missing. Please set GOOGLE_GEMINI_API_KEY in .env]"
    return "[Gemini response placeholder] " + prompt[:200]


def answer_query(query: str, resources_base: str):
    corpus = load_resources(resources_base)
    contexts = keyword_search(query, corpus)
    prompt = build_prompt(query, contexts)
    answer = generate_with_gemini(prompt)
    source_file = contexts[0][1] if contexts else None
    return answer, source_file, {"matches": [p for _, p, _ in contexts]}
