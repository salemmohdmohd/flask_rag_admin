import os
import json
import requests
import ssl
import numpy as np
import pickle
import hashlib
from pathlib import Path
from typing import List, Tuple, Dict, Optional


def get_chat_history(user_id: int, session_id: str, limit: int = 10) -> List[Dict]:
    """Retrieve recent chat history for conversation context."""
    if not user_id or not session_id:
        return []

    try:
        # Import here to avoid circular imports
        from .models.chat_models import ChatHistory

        # Get recent chats for this session
        chats = (
            ChatHistory.query.filter_by(user_id=user_id, session_id=session_id)
            .order_by(ChatHistory.created_at.desc())
            .limit(limit)
            .all()
        )

        # Convert to list of dicts, most recent first
        history = []
        for chat in reversed(chats):  # Reverse to get chronological order
            history.append(
                {
                    "message": chat.message,
                    "response": chat.response,
                    "created_at": chat.created_at.isoformat(),
                }
            )

        return history
    except Exception as e:
        print(f"Warning: Could not retrieve chat history: {e}")
        return []


def load_resources(base_dir: str) -> str:
    """Load all markdown files and return as a single context string."""
    resources_dir = Path(base_dir)
    all_content = []

    if not resources_dir.exists():
        return ""

    for path in resources_dir.rglob("*.md"):
        try:
            content = path.read_text(encoding="utf-8")
            filename = path.name
            all_content.append(f"# File: {filename}\n\n{content}\n\n")
        except Exception:
            continue

    return "\n".join(all_content)


def generate_text_embedding(text: str, api_key: str) -> Optional[List[float]]:
    """Generate text embedding using Google's text-embedding model."""
    url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent"

    payload = {
        "model": "models/text-embedding-004",
        "content": {"parts": [{"text": text}]},
    }

    headers = {"Content-Type": "application/json", "x-goog-api-key": api_key}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()

        data = response.json()
        embedding = data.get("embedding", {}).get("values", [])
        return embedding if embedding else None

    except Exception as e:
        print(f"Warning: Failed to generate embedding: {e}")
        return None


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0

    try:
        # Convert to numpy arrays for easier computation
        a = np.array(vec1)
        b = np.array(vec2)

        # Calculate cosine similarity
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot_product / (norm_a * norm_b)
    except Exception:
        return 0.0


def load_document_chunks(base_dir: str) -> List[Dict]:
    """Load all markdown files and split them into semantic chunks."""
    resources_dir = Path(base_dir)
    chunks = []

    if not resources_dir.exists():
        return chunks

    for path in resources_dir.rglob("*.md"):
        try:
            content = path.read_text(encoding="utf-8")
            filename = path.name

            # More intelligent chunking strategy
            sections = []
            current_section = ""
            current_header = ""

            lines = content.split("\n")
            for line in lines:
                stripped_line = line.strip()

                # If it's a header
                if stripped_line.startswith("#"):
                    # Save previous section if it exists and has enough content
                    if current_section.strip() and len(current_section.strip()) > 100:
                        sections.append(
                            {"text": current_section.strip(), "header": current_header}
                        )

                    # Start new section
                    current_header = stripped_line
                    current_section = line + "\n"

                # If it's an empty line and we have a substantial section
                elif stripped_line == "" and len(current_section.strip()) > 800:
                    # This could be a natural break point for very long sections
                    sections.append(
                        {"text": current_section.strip(), "header": current_header}
                    )
                    current_section = current_header + "\n" if current_header else ""

                else:
                    current_section += line + "\n"

            # Add the last section
            if current_section.strip() and len(current_section.strip()) > 100:
                sections.append(
                    {"text": current_section.strip(), "header": current_header}
                )

            # Create chunks with metadata - smarter filtering
            for i, section in enumerate(sections):
                section_text = section["text"]
                # Only include substantial sections (increased threshold)
                if len(section_text.strip()) > 300:  # Increased from 200 to 300
                    chunks.append(
                        {
                            "text": section_text,
                            "source_file": filename,
                            "chunk_id": f"{filename}_{i}",
                            "header": section.get("header", ""),
                            "embedding": None,  # Will be filled later
                            "file_mtime": path.stat().st_mtime,  # Track file modification time
                        }
                    )

        except Exception as e:
            print(f"Warning: Failed to process {path}: {e}")
            continue

    print(
        f"📊 Loaded {len(chunks)} document chunks from {len(list(resources_dir.rglob('*.md')))} files"
    )
    return chunks


def get_embeddings_cache_path(base_dir: str) -> Path:
    """Get the path for the embeddings cache file."""
    return Path(base_dir).parent / ".embeddings_cache.pkl"


def load_or_generate_embeddings(
    base_dir: str, api_key: str, force_refresh: bool = False
) -> List[Dict]:
    """Load existing embeddings or generate new ones for all document chunks."""
    cache_path = get_embeddings_cache_path(base_dir)
    chunks = load_document_chunks(base_dir)

    # Create a content hash that includes file modification times
    content_for_hash = []
    for chunk in chunks:
        content_for_hash.append(
            {"text": chunk["text"], "file_mtime": chunk.get("file_mtime", 0)}
        )

    content_hash = hashlib.md5(
        json.dumps(content_for_hash, sort_keys=True).encode()
    ).hexdigest()

    # Try to load from cache
    cached_data = None
    if cache_path.exists() and not force_refresh:
        try:
            with open(cache_path, "rb") as f:
                cached_data = pickle.load(f)

            # Check if content has changed (including file modification times)
            if cached_data.get("content_hash") == content_hash:
                print(
                    f"✅ Using cached embeddings ({len(cached_data.get('chunks', []))} chunks)"
                )
                return cached_data.get("chunks", [])
            else:
                print("📁 Content changed, updating embeddings...")
        except Exception as e:
            print(f"Warning: Failed to load embeddings cache: {e}")

    # Count chunks that need new embeddings
    existing_embeddings = {}
    if cached_data and cached_data.get("chunks"):
        for chunk in cached_data["chunks"]:
            existing_embeddings[chunk["chunk_id"]] = chunk.get("embedding")

    chunks_to_process = []
    for chunk in chunks:
        if (
            chunk["chunk_id"] in existing_embeddings
            and existing_embeddings[chunk["chunk_id"]]
        ):
            chunk["embedding"] = existing_embeddings[chunk["chunk_id"]]
        else:
            chunks_to_process.append(chunk)

    if chunks_to_process:
        print(
            f"🔄 Generating embeddings for {len(chunks_to_process)} new/changed chunks (total: {len(chunks)})..."
        )

        # Process in batches with progress indicators
        batch_size = 10
        for i in range(0, len(chunks_to_process), batch_size):
            batch = chunks_to_process[i : i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(chunks_to_process) + batch_size - 1) // batch_size

            print(
                f"📦 Processing batch {batch_num}/{total_batches} ({len(batch)} chunks)"
            )

            for j, chunk in enumerate(batch):
                embedding = generate_text_embedding(chunk["text"], api_key)
                chunk["embedding"] = embedding

                if embedding is None:
                    print(
                        f"⚠️ Failed to generate embedding for chunk {chunk['chunk_id']}"
                    )
    else:
        print("✅ All embeddings up to date!")

    # Cache the results
    try:
        cache_data = {
            "content_hash": content_hash,
            "chunks": chunks,
            "generated_at": json.dumps({"timestamp": "now"}),
        }

        with open(cache_path, "wb") as f:
            pickle.dump(cache_data, f)
        print(f"💾 Embeddings cached successfully ({len(chunks)} total chunks)")

    except Exception as e:
        print(f"Warning: Failed to cache embeddings: {e}")

    return chunks


def semantic_search(
    query: str, chunks: List[Dict], api_key: str, top_k: int = 5
) -> List[Dict]:
    """Find the most semantically similar chunks to the query."""
    # Generate embedding for the query
    query_embedding = generate_text_embedding(query, api_key)

    if not query_embedding:
        print("⚠️ Failed to generate query embedding")
        return []

    # Calculate similarities
    similarities = []
    for chunk in chunks:
        if chunk.get("embedding"):
            similarity = cosine_similarity(query_embedding, chunk["embedding"])
            similarities.append({"chunk": chunk, "similarity": similarity})

    # Sort by similarity and return top results
    similarities.sort(key=lambda x: x["similarity"], reverse=True)

    print(f"🔍 Found {len(similarities)} chunks, returning top {top_k}")
    for i, result in enumerate(similarities[:3]):  # Show top 3 similarities
        print(
            f"  {i+1}. {result['chunk']['source_file']} (similarity: {result['similarity']:.3f})"
        )

    return [result["chunk"] for result in similarities[:top_k]]


def call_gemini(
    prompt: str, api_key: str, model: str = None, timeout: int = 15
) -> Tuple[Optional[str], Optional[Dict], Optional[str]]:
    """Call Gemini API with enhanced error handling."""
    model = model or os.getenv("GOOGLE_GEMINI_MODEL", "gemini-1.5-flash-latest")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,  # Lower temperature for more consistent analysis
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 2048,  # Increased for detailed analysis
        },
        "safetySettings": [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE",
            },
        ],
    }

    data = json.dumps(payload)
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, data=data, headers=headers, timeout=timeout)
        response.raise_for_status()  # Raises HTTPError for bad responses
        response_data = response.json()
    except requests.exceptions.HTTPError as e:
        try:
            error_data = e.response.json()
            error_detail = error_data.get("error", {}).get("message", str(e))
        except:
            error_detail = f"HTTP {e.response.status_code}: {str(e)}"
        return None, None, f"API Error: {error_detail}"
    except Exception as e:
        return None, None, f"Request Error: {str(e)}"

    # Extract response text
    try:
        candidates = response_data.get("candidates", [])
        if not candidates:
            return None, None, "No response generated"

        content = candidates[0].get("content", {})
        parts = content.get("parts", [])

        if not parts:
            return None, None, "Empty response from AI"

        text = "".join(part.get("text", "") for part in parts).strip()

        if not text:
            return None, None, "Empty text in response"

    except Exception as e:
        return None, None, f"Failed to parse response: {str(e)}"

    # Extract usage metadata
    usage = None
    try:
        usage_metadata = response_data.get("usageMetadata", {})
        if usage_metadata:
            usage = {
                "prompt_tokens": usage_metadata.get("promptTokenCount", 0),
                "completion_tokens": usage_metadata.get("candidatesTokenCount", 0),
                "total_tokens": usage_metadata.get("totalTokenCount", 0),
            }
    except Exception:
        # Fallback token estimation
        prompt_tokens = len(prompt.split()) * 1.3
        completion_tokens = len(text.split()) * 1.3
        usage = {
            "prompt_tokens": int(prompt_tokens),
            "completion_tokens": int(completion_tokens),
            "total_tokens": int(prompt_tokens + completion_tokens),
        }

    return text, usage, None


def create_analysis_prompt(
    query: str, all_data: str, chat_history: List[Dict] = None, persona_name: str = None
) -> str:
    """Create a comprehensive prompt for LLM-driven analysis with conversation memory and persona support."""

    # Import here to avoid circular imports
    from .models.persona_models import Persona

    # Get the persona to use
    if persona_name:
        persona = Persona.query.filter_by(name=persona_name, is_active=True).first()
    else:
        # Get the default persona
        persona = Persona.query.filter_by(is_default=True, is_active=True).first()
        if not persona:
            # Fallback to any active persona
            persona = Persona.query.filter_by(is_active=True).first()

    # Build the persona-specific prompt
    persona_prompt = ""
    if persona and persona.prompt_content:
        persona_prompt = f"\n{persona.prompt_content}\n"
    elif persona:
        # Fallback persona prompt based on basic info
        expertise = (
            ", ".join(persona.expertise_areas)
            if persona.expertise_areas
            else "general knowledge"
        )
        persona_prompt = f"\nYou are {persona.display_name}, an AI assistant specializing in {expertise}. {persona.description}\n"
    else:
        # Default persona prompt
        persona_prompt = "\nYou are a helpful AI assistant with broad knowledge across multiple domains.\n"

    # Build conversation context
    conversation_context = ""
    if chat_history:
        conversation_context = "\n## Recent Conversation History:\n"
        for chat in chat_history[-3:]:  # Last 3 exchanges
            conversation_context += (
                f"Human: {chat['message']}\nAssistant: {chat['response']}\n\n"
            )
        conversation_context += "---\n"

    # Create the complete prompt
    prompt = f"""{persona_prompt}

You are analyzing the following knowledge base to answer user questions. Use the provided data to give accurate, detailed, and helpful responses.

{conversation_context}

## Knowledge Base Context:
{all_data}

## User Question:
{query}

## Instructions:
1. Analyze the provided knowledge base content carefully
2. Answer the user's question directly and comprehensively
3. Use specific information from the knowledge base when available
4. If the information isn't in the knowledge base, say so clearly
5. Provide practical, actionable advice when appropriate
6. Keep your response focused and well-structured

Please provide a helpful response:"""

    return prompt


def answer_query(
    query: str,
    user_id: int = None,
    session_id: str = None,
    persona_name: str = None,
) -> Tuple[str, Optional[str], Dict]:
    """
    LLM-driven RAG pipeline with semantic search, conversation memory, and persona support.

    Args:
        query: User's question
        user_id: User ID for retrieving conversation history
        session_id: Session ID for conversation memory
        persona_name: AI persona/mode to use (e.g., 'business_data_analyst', 'career_consultant')

    Returns:
        tuple: (response_text, source_info, metadata)
    """
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY", "").strip()

    # Require API key - no fallback
    if (
        not api_key
        or api_key == "AIzaSy-PLACEHOLDER-GET-YOUR-OWN-KEY-FROM-GOOGLE-AI-STUDIO"
    ):
        raise ValueError(
            "GOOGLE_GEMINI_API_KEY is required. Get one from https://makersuite.google.com/app/apikey"
        )

    # Define the static path to the knowledge base resources
    current_dir = Path(__file__).parent
    resources_base = current_dir / "resources"

    if not resources_base.exists():
        raise ValueError(f"Knowledge base directory not found at {resources_base}")

    # Use semantic search to find relevant content
    print(f"🔍 Using semantic search for query: {query}")

    # Load or generate embeddings for all documents
    chunks = load_or_generate_embeddings(str(resources_base), api_key)

    if not chunks:
        raise ValueError(
            "No knowledge documents found. Add Markdown files to the resources directory."
        )

    # Find semantically relevant chunks
    relevant_chunks = semantic_search(query, chunks, api_key, top_k=5)

    if not relevant_chunks:
        raise ValueError(f"No relevant content found for query: {query}")

    # Combine relevant chunks into context
    relevant_data = "\n\n".join(
        [
            f"# From: {chunk['source_file']}\n{chunk['text']}"
            for chunk in relevant_chunks
        ]
    )

    # Get source file info from the most relevant chunk
    source_file = relevant_chunks[0]["source_file"]

    # Get conversation history for context
    chat_history = (
        get_chat_history(user_id, session_id, limit=5) if user_id and session_id else []
    )

    # Create comprehensive analysis prompt with conversation memory, relevant data, and persona
    prompt = create_analysis_prompt(query, relevant_data, chat_history, persona_name)

    # Get AI analysis
    print(f"🤖 Using LLM-driven analysis with semantic search for query: {query}")
    response_text, usage, error = call_gemini(prompt, api_key)

    if error:
        raise RuntimeError(f"Gemini API failed: {error}")

    if not response_text:
        raise RuntimeError("Empty response from Gemini API")

    # Extract follow-up suggestions if present
    follow_up_suggestions = []
    if "🤔 You might also want to ask:" in response_text:
        # Split response to separate main content from suggestions
        parts = response_text.split("## 🤔 You might also want to ask:")
        if len(parts) > 1:
            main_response = parts[0].strip()
            suggestions_text = parts[1].strip()

            # Extract bullet points as suggestions
            for line in suggestions_text.split("\n"):
                line = line.strip()
                if line.startswith("- ") or line.startswith("* "):
                    suggestion = line[2:].strip()
                    if suggestion:
                        follow_up_suggestions.append(suggestion)

            # Use main response without suggestions for display
            response_text = main_response

    # Get persona information for metadata
    from .models.persona_models import Persona

    current_persona_data = None
    if persona_name:
        persona = Persona.query.filter_by(name=persona_name, is_active=True).first()
        if persona:
            current_persona_data = {
                "name": persona.name,
                "display_name": persona.display_name,
                "description": persona.description,
                "expertise_areas": persona.expertise_areas or [],
            }

    if not current_persona_data:
        # Get default persona
        default_persona = Persona.query.filter_by(
            is_default=True, is_active=True
        ).first()
        if default_persona:
            current_persona_data = {
                "name": default_persona.name,
                "display_name": default_persona.display_name,
                "description": default_persona.description,
                "expertise_areas": default_persona.expertise_areas or [],
            }

    return (
        response_text,
        source_file,
        {
            "token_usage": usage
            or {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            "ai_generated": True,
            "query": query,
            "data_length": len(relevant_data),
            "follow_up_suggestions": follow_up_suggestions,
            "semantic_search": True,
            "relevant_chunks": len(relevant_chunks),
            "persona": current_persona_data,
        },
    )
