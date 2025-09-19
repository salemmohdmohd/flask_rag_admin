import os
import math
import json
import urllib.request
import urllib.error
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


def call_gemini(prompt: str, api_key: str, model: str = None, timeout: int = 10):
    model = model or os.getenv("GOOGLE_GEMINI_MODEL", "gemini-1.5-flash-latest")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                ]
            }
        ]
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            js = json.loads(raw)
    except urllib.error.HTTPError as e:
        try:
            msg = e.read().decode("utf-8")
        except Exception:
            msg = str(e)
        return None, None, f"HTTPError {e.code}: {msg}"
    except Exception as e:
        return None, None, f"Error: {e}"

    text = None
    try:
        cands = js.get("candidates") or []
        if cands:
            parts = cands[0].get("content", {}).get("parts", [])
            texts = [p.get("text", "") for p in parts if isinstance(p, dict)]
            text = "".join(texts).strip()
    except Exception:
        text = None

    usage = None
    try:
        um = js.get("usageMetadata") or {}
        if um:
            usage = {
                "prompt_tokens": um.get("promptTokenCount", 0),
                "completion_tokens": um.get("candidatesTokenCount", 0),
                "total_tokens": um.get("totalTokenCount", 0),
            }
    except Exception:
        usage = None

    return text, usage, None


def answer_query(query: str, resources_base: str):
    corpus = load_resources(resources_base)
    contexts = keyword_search(query, corpus)
    if not contexts:
        return (
            "I don't know based on current knowledge. Add markdown docs in Admin > Tools or Editor, then try again.",
            None,
            {
                "matches": [],
                "token_usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                },
            },
        )
    prompt = build_prompt(query, contexts)
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY", "").strip()
    prompt_tokens = int(math.ceil(len(prompt) / 4))
    if api_key:
        text, usage, err = call_gemini(prompt, api_key=api_key)
        if text:
            if not usage:
                completion_tokens = int(math.ceil(len(text) / 4))
                usage = {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": prompt_tokens + completion_tokens,
                }
            return (
                text,
                contexts[0][1],
                {
                    "matches": [p for _, p, _ in contexts],
                    "token_usage": usage,
                },
            )
    top = contexts[0]
    top_path = Path(top[1])
    snippet = (top[2] or "")[:500]
    answer = f"From {top_path.name}:\n{snippet}"
    completion_tokens = int(math.ceil(len(answer) / 4))
    return (
        answer,
        top[1],
        {
            "matches": [p for _, p, _ in contexts],
            "token_usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            },
        },
    )
