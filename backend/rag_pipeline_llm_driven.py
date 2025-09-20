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
    query: str, all_data: str, chat_history: List[Dict] = None
) -> str:
    """Create a comprehensive prompt for LLM-driven analysis with conversation memory."""

    # Add conversation context if available
    conversation_context = ""
    if chat_history:
        conversation_context = "\n\nCONVERSATION HISTORY (for context):\n"
        for i, chat in enumerate(chat_history[-5:], 1):  # Last 5 messages for context
            conversation_context += f"{i}. USER: {chat['message']}\n"
            conversation_context += f"   AI: {chat['response'][:200]}{'...' if len(chat['response']) > 200 else ''}\n\n"
        conversation_context += "---\n"

    return f"""You are an intelligent business data analyst. Your task is to understand the user's question and provide a comprehensive, helpful response based on the available data.

USER QUESTION: "{query}"{conversation_context}

AVAILABLE DATA:
{all_data}

ANALYSIS INSTRUCTIONS:
1. UNDERSTAND THE QUERY:
   - What is the user asking for exactly?
   - What type of information do they need? (financial, team, project, etc.)
   - What time period are they interested in? (today, yesterday, all time, etc.)
   - How specific or general is their request?
   - Consider the conversation history - are they following up on a previous question?

2. ANALYZE THE DATA:
   - Find all relevant information that answers their question
   - Calculate totals, averages, or summaries if needed
   - Identify patterns or insights that would be helpful
   - Consider what context would be most valuable

3. PROVIDE A SMART RESPONSE:
   - Give a direct, clear answer to their specific question
   - Use proper Markdown formatting for readability
   - Include relevant calculations or breakdowns
   - Add helpful context or insights
   - If this is a follow-up question, reference previous context when relevant

4. GENERATE FOLLOW-UP SUGGESTIONS:
   - Based on your response and the available data, suggest 3-4 relevant follow-up questions
   - Make suggestions that help users discover more useful information
   - Consider different angles: time comparisons, category breakdowns, trends, predictions
   - Format them as a simple bulleted list at the end

5. FORMATTING GUIDELINES:
   - Use **bold** for important numbers and totals
   - Use bullet points (-) for lists and breakdowns
   - Use ## for section headers when appropriate
   - Include emojis (💰, 📊, 📅, etc.) to make it visually appealing
   - Keep the response focused and not overly verbose

6. RESPONSE STRUCTURE:
   - Start with a clear header that matches their question
   - Provide the main answer/data they requested
   - Include relevant breakdowns or details
   - End with a "## 🤔 You might also want to ask:" section with follow-up suggestions

IMPORTANT: Base your response ONLY on the data provided above. If the data doesn't contain what they're asking for, say so clearly and suggest what information is available instead.

Provide your comprehensive response with follow-up suggestions:"""


def answer_query(
    query: str, resources_base: str, user_id: int = None, session_id: str = None
) -> Tuple[str, Optional[str], Dict]:
    """
    LLM-driven RAG pipeline with conversation memory support.

    Args:
        query: User's question
        resources_base: Path to knowledge base files
        user_id: User ID for retrieving conversation history
        session_id: Session ID for conversation memory

    Returns:
        tuple: (response_text, source_info, metadata)
    """
    # Load all data as a single context
    all_data = load_resources(resources_base)

    if not all_data:
        return (
            "I don't have any knowledge documents loaded yet. Please add some Markdown files to get started.",
            None,
            {
                "token_usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                },
                "ai_generated": False,
                "error": "No data available",
            },
        )

    # Get conversation history for context
    chat_history = (
        get_chat_history(user_id, session_id, limit=5) if user_id and session_id else []
    )

    # Create comprehensive analysis prompt with conversation memory
    prompt = create_analysis_prompt(query, all_data, chat_history)
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY", "").strip()

    # Check for API key
    if (
        not api_key
        or api_key == "AIzaSy-PLACEHOLDER-GET-YOUR-OWN-KEY-FROM-GOOGLE-AI-STUDIO"
    ):
        return (
            f"""## ⚠️ AI Analysis Not Available

I need a Google Gemini API key to provide intelligent analysis for: **"{query}"**

**Available raw data:**
```
{all_data[:500]}...
```

**To enable smart responses:**
1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env` file: `GOOGLE_GEMINI_API_KEY=your_key_here`
3. Restart the server

The AI will then provide intelligent analysis, calculations, and insights for your questions.""",
            "system_message",
            {
                "token_usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                },
                "ai_generated": False,
                "error": "No API key",
            },
        )

    # Get AI analysis
    print(f"🤖 Using LLM-driven analysis for query: {query}")
    response_text, usage, error = call_gemini(prompt, api_key)

    if response_text and not error:
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

        return (
            response_text,
            "llm_analysis",
            {
                "token_usage": usage
                or {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                "ai_generated": True,
                "query": query,
                "data_length": len(all_data),
                "follow_up_suggestions": follow_up_suggestions,
            },
        )
    else:
        # Fallback with error info
        return (
            f"""## ❌ AI Analysis Failed

**Query:** "{query}"
**Error:** {error}

**Available raw data:**
```
{all_data[:1000]}...
```

**Troubleshooting:**
- Check your internet connection
- Verify your Google Gemini API key is valid
- Try a simpler question

The system will retry automatically on your next question.""",
            "error_response",
            {
                "token_usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                },
                "ai_generated": False,
                "error": error,
            },
        )
