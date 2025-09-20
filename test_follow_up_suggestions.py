#!/usr/bin/env python3
"""
Test script to verify smart follow-up suggestions functionality
in the LLM-driven RAG pipeline.
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.rag_pipeline_llm_driven import answer_query


def test_follow_up_suggestions():
    """Test smart follow-up suggestions feature."""

    resources_dir = os.path.join(os.path.dirname(__file__), "backend", "resources")
    user_id = 999  # Test user ID
    session_id = "test-followup-session"

    print("💡 Testing Smart Follow-up Suggestions")
    print("=" * 50)

    # Test questions that should generate good follow-up suggestions
    test_queries = [
        "How much did we spend today?",
        "What are our team goals?",
        "Show me our project status",
    ]

    for i, query in enumerate(test_queries, 1):
        print(f"\n📝 Question {i}: {query}")
        print("-" * 40)

        try:
            response, source_file, context = answer_query(
                query, resources_dir, user_id, session_id
            )

            print(f"🤖 Response:")
            print(f"{response}")

            # Check for follow-up suggestions
            follow_up_suggestions = context.get("follow_up_suggestions", [])
            if follow_up_suggestions:
                print(f"\n💡 Follow-up Suggestions:")
                for j, suggestion in enumerate(follow_up_suggestions, 1):
                    print(f"   {j}. {suggestion}")
            else:
                print(f"\n⚠️ No follow-up suggestions generated")

            print(f"\n📄 Source: {source_file or 'No specific source'}")

            if context and "token_usage" in context:
                print(f"🔢 Tokens: {context['token_usage']}")

        except Exception as e:
            print(f"❌ Error: {str(e)}")

        print("\n" + "=" * 50)


if __name__ == "__main__":
    test_follow_up_suggestions()
