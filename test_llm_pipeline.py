#!/usr/bin/env python3
"""
Test script to directly test the new LLM-driven RAG pipeline
without needing authentication or frontend setup.
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.rag_pipeline_llm_driven import answer_query


def test_queries():
    """Test various queries to see how the LLM-driven approach performs."""

    resources_dir = os.path.join(os.path.dirname(__file__), "backend", "resources")

    test_cases = [
        "how much did we spend today?",
        "what are our team goals?",
        "show me project status",
        "who is working on what?",
        "what's our budget for this month?",
        "tell me about our development process",
    ]

    print("🚀 Testing New LLM-Driven RAG Pipeline")
    print("=" * 50)

    for i, query in enumerate(test_cases, 1):
        print(f"\n📝 Test {i}: {query}")
        print("-" * 30)

        try:
            response, source_file, context = answer_query(query, resources_dir)

            print(f"✅ Response:")
            print(f"{response}")
            print(f"\n📄 Source: {source_file or 'No specific source'}")

            if context and "token_usage" in context:
                print(f"🔢 Tokens: {context['token_usage']}")

        except Exception as e:
            print(f"❌ Error: {str(e)}")

        print("\n" + "=" * 50)


if __name__ == "__main__":
    test_queries()
