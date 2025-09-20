#!/usr/bin/env python3
"""
Test script to verify conversation memory functionality
in the LLM-driven RAG pipeline.
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.rag_pipeline_llm_driven import answer_query


def test_conversation_memory():
    """Test conversation memory with follow-up questions."""

    resources_dir = os.path.join(os.path.dirname(__file__), "backend", "resources")
    user_id = 999  # Test user ID
    session_id = "test-conversation-session"

    print("🧠 Testing Conversation Memory")
    print("=" * 50)

    # Simulate a conversation with follow-up questions
    conversation = [
        "How much did we spend today?",
        "What about yesterday?",
        "Which day was more expensive?",
        "Show me the breakdown for the more expensive day",
        "What's our biggest expense category?",
    ]

    for i, query in enumerate(conversation, 1):
        print(f"\n💬 Question {i}: {query}")
        print("-" * 30)

        try:
            response, source_file, context = answer_query(
                query, resources_dir, user_id, session_id
            )

            print(f"🤖 Response:")
            print(f"{response}")
            print(f"\n📄 Source: {source_file or 'No specific source'}")

            if context and "token_usage" in context:
                print(f"🔢 Tokens: {context['token_usage']}")

        except Exception as e:
            print(f"❌ Error: {str(e)}")

        print("\n" + "=" * 50)

        # Add a small delay between questions to simulate natural conversation
        import time

        time.sleep(1)


if __name__ == "__main__":
    test_conversation_memory()
