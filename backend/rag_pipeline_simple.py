import os
import math
import json
import urllib.request
import urllib.error
from pathlib import Path
import re
from typing import List, Tuple, Dict, Optional
from datetime import datetime, timedelta


def normalize_query(query: str) -> Tuple[str, Dict]:
    """
    Enhanced query preprocessing for better understanding.
    Returns normalized query and extracted metadata.
    """
    original_query = query
    query = query.lower().strip()
    metadata = {
        "original": original_query,
        "intent": "general",
        "date_context": None,
        "financial_focus": False,
        "team_focus": False,
        "project_focus": False,
        "urgency": "normal",
    }

    # Date context parsing
    today = datetime.now()
    if any(word in query for word in ["today", "this day", "current day"]):
        metadata["date_context"] = today.strftime("%Y-%m-%d")
    elif any(word in query for word in ["yesterday", "previous day"]):
        yesterday = today - timedelta(days=1)
        metadata["date_context"] = yesterday.strftime("%Y-%m-%d")
    elif any(word in query for word in ["this week", "current week"]):
        metadata["date_context"] = "current_week"
    elif any(word in query for word in ["last week", "previous week"]):
        metadata["date_context"] = "last_week"
    elif any(word in query for word in ["this month", "current month"]):
        metadata["date_context"] = "current_month"

    # Intent classification
    financial_terms = [
        "spend",
        "spent",
        "cost",
        "expense",
        "budget",
        "money",
        "price",
        "total",
        "payment",
        "bill",
    ]
    team_terms = [
        "team",
        "who",
        "staff",
        "people",
        "employee",
        "developer",
        "member",
        "colleague",
    ]
    project_terms = [
        "project",
        "status",
        "progress",
        "deadline",
        "complete",
        "task",
        "milestone",
    ]

    # Special handling for "total" queries
    if "total" in query and any(
        term in query for term in ["spend", "spent", "cost", "expense"]
    ):
        metadata["financial_focus"] = True
        metadata["intent"] = "financial_summary"
        # If no specific date mentioned, assume they want recent summary
        if not metadata["date_context"]:
            metadata["date_context"] = "recent_days"
    elif any(term in query for term in financial_terms):
        metadata["financial_focus"] = True
        metadata["intent"] = "financial"
    elif any(term in query for term in team_terms):
        metadata["team_focus"] = True
        metadata["intent"] = "team"
    elif any(term in query for term in project_terms):
        metadata["project_focus"] = True
        metadata["intent"] = "project"

    # Urgency detection
    if any(
        word in query
        for word in ["urgent", "asap", "immediately", "critical", "emergency"]
    ):
        metadata["urgency"] = "high"
    elif any(word in query for word in ["when possible", "eventually", "sometime"]):
        metadata["urgency"] = "low"

    # Query expansion for better matching
    expanded_terms = []
    if metadata["financial_focus"]:
        expanded_terms.extend(["expenditure", "costs", "charges", "fees"])
    if metadata["team_focus"]:
        expanded_terms.extend(["workforce", "personnel", "staff members"])
    if metadata["project_focus"]:
        expanded_terms.extend(["deliverables", "timeline", "objectives"])

    # Add expanded terms to query for better matching
    if expanded_terms:
        query = f"{query} {' '.join(expanded_terms)}"

    return query, metadata


def load_resources(base_dir: str) -> dict:
    """Load all markdown files from the resources directory."""
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


def extract_text_chunks(content: str, chunk_size: int = 500) -> List[str]:
    """Break content into meaningful chunks for better context retrieval."""
    # Split by paragraphs first
    paragraphs = content.split("\n\n")
    chunks = []
    current_chunk = ""

    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) < chunk_size:
            current_chunk += paragraph + "\n\n"
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            current_chunk = paragraph + "\n\n"

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


def semantic_search(
    query: str, corpus: dict, top_k: int = 3, query_metadata: Dict = None
) -> List[Tuple[float, str, str]]:
    """Improved search with better scoring and context extraction."""
    query_lower = query.lower()
    query_words = set(query_lower.split())

    # Use metadata for enhanced scoring
    metadata = query_metadata or {}

    scored_chunks = []

    for file_path, content in corpus.items():
        content_lower = content.lower()
        chunks = extract_text_chunks(content)

        for chunk in chunks:
            chunk_lower = chunk.lower()

            # Calculate relevance score
            score = 0

            # Exact phrase match (highest priority)
            if query_lower in chunk_lower:
                score += 15

            # Word matches with enhanced weighting
            chunk_words = set(chunk_lower.split())
            word_matches = len(query_words.intersection(chunk_words))
            score += word_matches * 3

            # Intent-based scoring boosts
            if metadata.get("financial_focus") and any(
                term in chunk_lower
                for term in ["$", "cost", "expense", "budget", "total"]
            ):
                score += 10
            if metadata.get("team_focus") and any(
                term in chunk_lower
                for term in ["team", "developer", "employee", "member"]
            ):
                score += 10
            if metadata.get("project_focus") and any(
                term in chunk_lower
                for term in ["project", "status", "progress", "complete"]
            ):
                score += 10

            # Date context scoring
            if metadata.get("date_context"):
                date_str = metadata["date_context"]
                if isinstance(date_str, str):
                    # Enhanced date matching
                    if date_str == "2025-09-19" and any(
                        term in chunk_lower
                        for term in ["september 19", "2025-09-19", "today"]
                    ):
                        score += 15
                    elif date_str == "2025-09-18" and any(
                        term in chunk_lower
                        for term in ["september 18", "2025-09-18", "yesterday"]
                    ):
                        score += 15
                    elif "current_week" in date_str and any(
                        term in chunk_lower for term in ["this week", "current week"]
                    ):
                        score += 10
                    elif "last_week" in date_str and any(
                        term in chunk_lower for term in ["last week", "previous week"]
                    ):
                        score += 10
                    # Fallback for any date mentions
                    elif date_str in chunk_lower or any(
                        date_term in chunk_lower for date_term in ["september", "2025"]
                    ):
                        score += 5

            # Keyword density with improved calculation
            total_words = len(chunk_words)
            if total_words > 0:
                density = word_matches / total_words
                score += density * 8

            if score > 0:
                # Preserve Markdown formatting and line breaks
                clean_chunk = chunk.strip()
                if len(clean_chunk) > 500:
                    # Find a good break point (end of line or paragraph)
                    break_point = clean_chunk.rfind("\n", 300, 500)
                    if break_point == -1:
                        break_point = clean_chunk.rfind(" ", 300, 500)
                    if break_point == -1:
                        break_point = 400
                    clean_chunk = clean_chunk[:break_point] + "..."

                scored_chunks.append((score, file_path, clean_chunk))

    # Sort by score and return top results
    scored_chunks.sort(reverse=True, key=lambda x: x[0])
    return scored_chunks[:top_k]


def build_enhanced_prompt(
    query: str, contexts: List[Tuple[float, str, str]], query_metadata: Dict = None
) -> str:
    """Build a more sophisticated prompt for better AI responses."""
    metadata = query_metadata or {}

    if not contexts:
        return f"""You are a helpful assistant. The user asked: "{query}"

I don't have specific information about this in my knowledge base. Please provide a helpful response acknowledging that you don't have the specific information they're looking for, and suggest what they might do instead."""

    # Use metadata for better context analysis
    query_lower = query.lower()
    is_financial_query = metadata.get("financial_focus", False) or any(
        word in query_lower
        for word in [
            "spend",
            "spent",
            "cost",
            "expense",
            "money",
            "budget",
            "price",
            "total",
        ]
    )
    is_team_query = metadata.get("team_focus", False) or any(
        word in query_lower
        for word in ["team", "who", "staff", "people", "employee", "developer"]
    )
    is_project_query = metadata.get("project_focus", False) or any(
        word in query_lower
        for word in ["project", "status", "progress", "deadline", "complete"]
    )

    context_text = ""
    for i, (score, file_path, chunk) in enumerate(contexts, 1):
        file_name = Path(file_path).stem
        context_text += f"[Source {i}: {file_name}]\n{chunk}\n\n"

    # Create specialized instructions based on query type
    specialized_instructions = ""
    if is_financial_query:
        specialized_instructions = """
FINANCIAL QUERY GUIDELINES:
- Calculate totals when possible
- Present amounts clearly with currency symbols
- Use tables or bullet points for financial breakdowns
- Highlight the final total amount in bold
- Be precise with numbers"""
    elif is_team_query:
        specialized_instructions = """
TEAM QUERY GUIDELINES:
- List team members with their roles
- Provide team size information when available
- Format team information clearly with roles and responsibilities"""
    elif is_project_query:
        specialized_instructions = """
PROJECT QUERY GUIDELINES:
- Provide project status percentages when available
- Include timeline information (deadlines, completion dates)
- Summarize current project phase or status clearly"""

    return f"""You are an intelligent business assistant. Analyze the user's question and provide a smart, contextual response.

USER QUESTION: "{query}"

CONTEXT ANALYSIS:
- Query Type: {"Financial" if is_financial_query else "Team" if is_team_query else "Project" if is_project_query else "General"}
- Intent: {metadata.get("intent", "general")}
- Date Context: {metadata.get("date_context", "not specified")}
- Urgency: {metadata.get("urgency", "normal")}
- Task: Provide a direct, intelligent answer that demonstrates understanding

RESPONSE GUIDELINES:
- Be conversational and intelligent, not just informational
- Analyze and interpret the data, don't just repeat it
- Use proper Markdown formatting for clarity
- Provide insights and summaries when appropriate
- Answer the specific question asked, not just dump information
- Use **bold** for key numbers and important points
- Format lists and tables for easy reading{specialized_instructions}

MARKDOWN FORMATTING:
- Use **bold** for important amounts or key information
- Use bullet points (-) for lists
- Use ## for section headers if needed
- Use tables for financial data when appropriate

Context Information:
{context_text}

Provide an intelligent, analyzed response (in Markdown format):"""


def call_gemini(
    prompt: str, api_key: str, model: str = None, timeout: int = 15
) -> Tuple[Optional[str], Optional[Dict], Optional[str]]:
    """Enhanced Gemini API call with better error handling and configuration."""
    model = model or os.getenv("GOOGLE_GEMINI_MODEL", "gemini-1.5-flash-latest")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 1024,
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

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            response_data = json.loads(raw)
    except urllib.error.HTTPError as e:
        try:
            error_msg = e.read().decode("utf-8")
            error_data = json.loads(error_msg)
            error_detail = error_data.get("error", {}).get("message", str(e))
        except:
            error_detail = f"HTTP {e.code}: {str(e)}"
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
        prompt_tokens = len(prompt.split()) * 1.3  # rough estimation
        completion_tokens = len(text.split()) * 1.3
        usage = {
            "prompt_tokens": int(prompt_tokens),
            "completion_tokens": int(completion_tokens),
            "total_tokens": int(prompt_tokens + completion_tokens),
        }

    return text, usage, None


def generate_followup_suggestions(
    query: str, response: str, query_metadata: Dict
) -> List[str]:
    """Generate smart follow-up questions based on the query and response."""
    suggestions = []
    intent = query_metadata.get("intent", "general")

    if intent == "financial_summary":
        suggestions.extend(
            [
                "📅 Show me yesterday's expenses only",
                "📊 Break down by category",
                "📈 Compare with last week",
                "💰 What's our daily average spending?",
            ]
        )
    elif intent == "financial":
        suggestions.extend(
            [
                "📊 Show me a breakdown by category",
                "📈 How does this compare to last month?",
                "💡 What's our biggest expense category?",
                "🎯 Are we within budget for this period?",
            ]
        )
    elif intent == "team":
        suggestions.extend(
            [
                "👥 Who's working on what projects?",
                "📋 What are the current team assignments?",
                "🚀 Any team changes or new hires?",
                "⏰ What are the team's current schedules?",
            ]
        )
    elif intent == "project":
        suggestions.extend(
            [
                "⏱️ What are the upcoming deadlines?",
                "🔍 Show me project progress details",
                "⚠️ Any blocked or delayed tasks?",
                "🎯 What are the next milestones?",
            ]
        )
    else:
        # General suggestions based on available data
        suggestions.extend(
            [
                "💰 How much did we spend today?",
                "👥 Who's on our team?",
                "📋 What projects are we working on?",
                "📊 Show me company information",
            ]
        )

    # Add context-specific suggestions
    if "total" in response.lower() and "expense" in response.lower():
        suggestions.append("📋 Break down expenses by department")

    if "team" in response.lower():
        suggestions.append("📈 Show team productivity metrics")

    if "project" in response.lower():
        suggestions.append("📅 Show project timeline")

    # Remove duplicates and limit to 4 suggestions
    unique_suggestions = list(dict.fromkeys(suggestions))
    return unique_suggestions[:4]


def get_fallback_response(
    query: str, contexts: List[Tuple[float, str, str]], query_metadata: Dict = None
) -> str:
    """Generate a helpful fallback response when AI is not available."""
    metadata = query_metadata or {}

    if not contexts:
        return "I don't have information about that in my knowledge base. You might want to add relevant documents or ask about something else."

    # Use the best matching context and provide intelligent analysis
    best_context = contexts[0]
    snippet = best_context[2]

    # Analyze the query to provide smarter responses
    query_lower = query.lower()

    if metadata.get("financial_focus") or any(
        word in query_lower
        for word in ["spend", "spent", "cost", "expense", "money", "total"]
    ):
        # For financial queries, try to extract and calculate totals
        import re

        amounts = re.findall(r"\$[\d,]+\.?\d*", snippet)
        if amounts:
            # Try to calculate total if multiple amounts found
            try:
                total = sum(
                    float(amount.replace("$", "").replace(",", ""))
                    for amount in amounts
                )

                # Enhanced response based on intent
                if (
                    metadata.get("intent") == "financial_summary"
                    or "total" in query_lower
                ):
                    # For total/summary queries, provide comprehensive breakdown
                    return f"""## 💰 Expense Summary

{snippet}

### **Grand Total: ${total:,.2f}**

*This summary includes expenses from multiple days/categories. For specific day breakdowns, ask about individual dates.*

**💡 Quick Questions:**
- "How much did we spend yesterday?"
- "Show me today's expenses only"
- "What's our biggest expense category?"
"""
                else:
                    # For specific day queries
                    date_context = metadata.get("date_context", "today")
                    date_label = (
                        "today"
                        if date_context == "2025-09-19"
                        else (
                            "yesterday"
                            if date_context == "2025-09-18"
                            else "on this date"
                        )
                    )

                    return f"""## 📊 Daily Expenses

{snippet}

**💰 Total spent {date_label}: ${total:,.2f}**

*This includes all office expenses, technology costs, and travel expenses.*"""
            except:
                pass

    elif any(word in query_lower for word in ["team", "who", "staff", "people"]):
        return f"""## Team Information

{snippet}

*Our team is organized across different functions to deliver quality products and services.*"""

    elif any(word in query_lower for word in ["project", "status", "progress"]):
        return f"""## Project Status

{snippet}

*These projects represent our current development priorities and timelines.*"""

    # Default intelligent response
    return f"""## Information Found

{snippet}

*Based on the latest company information available.*"""


def answer_query(query: str, resources_base: str) -> Tuple[str, Optional[str], Dict]:
    """
    Enhanced RAG pipeline that provides intelligent, concise responses.

    Returns:
        tuple: (response_text, source_file, metadata)
    """
    # Enhanced query preprocessing
    processed_query, query_metadata = normalize_query(query)

    # Load and search documents
    corpus = load_resources(resources_base)

    if not corpus:
        return (
            "I don't have any knowledge documents loaded yet. Please add some Markdown files to get started.",
            None,
            {
                "matches": [],
                "token_usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                },
                "search_results": 0,
                "query_metadata": query_metadata,
            },
        )

    # Find relevant context with enhanced search
    contexts = semantic_search(
        processed_query, corpus, top_k=3, query_metadata=query_metadata
    )

    if not contexts:
        return (
            "I couldn't find information about that in the available documents. Try rephrasing your question or add relevant content.",
            None,
            {
                "matches": [],
                "token_usage": {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                },
                "search_results": 0,
            },
        )

    # Build enhanced prompt with metadata
    prompt = build_enhanced_prompt(query, contexts, query_metadata)
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY", "").strip()

    # Try AI generation first
    if (
        api_key
        and api_key != "AIzaSy-PLACEHOLDER-GET-YOUR-OWN-KEY-FROM-GOOGLE-AI-STUDIO"
    ):
        print(f"🤖 Using Google Gemini AI for query: {query}")
        response_text, usage, error = call_gemini(prompt, api_key)

        if response_text and not error:
            # Generate follow-up suggestions for AI responses too
            suggestions = generate_followup_suggestions(
                query, response_text, query_metadata
            )

            return (
                response_text,
                contexts[0][1],  # Best matching source file
                {
                    "matches": [path for _, path, _ in contexts],
                    "token_usage": usage
                    or {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                    "search_results": len(contexts),
                    "ai_generated": True,
                    "followup_suggestions": suggestions,
                    "query_metadata": query_metadata,
                },
            )
        else:
            # Log the error for debugging but don't show it to user
            print(f"AI Error: {error}")
    else:
        print(f"💡 Using enhanced fallback (no API key) for query: {query}")

    # Fallback to context-based response
    fallback_response = get_fallback_response(query, contexts, query_metadata)

    # Generate follow-up suggestions
    suggestions = generate_followup_suggestions(
        query, fallback_response, query_metadata
    )

    estimated_tokens = {
        "prompt_tokens": len(prompt.split()),
        "completion_tokens": len(fallback_response.split()),
        "total_tokens": len(prompt.split()) + len(fallback_response.split()),
    }

    return (
        fallback_response,
        contexts[0][1],
        {
            "matches": [path for _, path, _ in contexts],
            "token_usage": estimated_tokens,
            "search_results": len(contexts),
            "ai_generated": False,
            "followup_suggestions": suggestions,
            "query_metadata": query_metadata,
        },
    )
