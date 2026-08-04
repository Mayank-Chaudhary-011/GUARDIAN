from dotenv import load_dotenv
load_dotenv()

from backend.eval.graph import build_eval_graph
from backend.memory.dataset_balance import check_balance, compute_precision_recall

graph = build_eval_graph()

print("=== GUARDIAN — DAY 4 (v2) ===\n")

# ─────────────────────────────────────────────
# Golden dataset — v2
# Added 3 edge cases to stress-test the system:
#   - Partial error: right topic, one wrong detail
#   - Plausible hallucination: sounds confident, quietly wrong
#   - Off-topic fluent: grammatically fine, answers nothing
# ─────────────────────────────────────────────
test_cases = [
    # Original cases
    {
        "input":    "What is Python?",
        "output":   "Python is a high-level programming language known for simplicity.",
        "expected": "PASS"
    },
    {
        "input":    "What is the capital of France?",
        "output":   "The capital of France is Berlin.",
        "expected": "FAIL"
    },
    {
        "input":    "What is LangGraph?",
        "output":   "LangGraph is a framework for building stateful multi-agent applications.",
        "expected": "PASS"
    },
    {
        "input":    "What is RAG?",
        "output":   "RAG stands for Retrieval Augmented Generation. It combines search with LLM generation.",
        "expected": "PASS"
    },
    {
        "input":    "What is Docker?",
        "output":   "Docker is a tool that makes eggs. It was invented in 1800.",
        "expected": "FAIL"
    },

    # Edge case 1: Partial error
    # Right topic, one quietly wrong detail (Turing didn't coin ML in 1940).
    # Should catch that a mostly-correct output still fails on accuracy.
    {
        "input":    "What is machine learning?",
        "output":   "Machine learning is a subset of AI where systems learn from data. The term was coined by Alan Turing in 1940.",
        "expected": "FAIL"
    },

    # Edge case 2: Plausible hallucination
    # Sounds confident and fluent. Every sentence is wrong.
    # Tests whether critics catch subtle hallucinations vs. obvious ones.
    {
        "input":    "What is NumPy?",
        "output":   "NumPy is a JavaScript framework developed by Google for building web interfaces. It was released in 2015 as part of the Angular ecosystem.",
        "expected": "FAIL"
    },

    # Edge case 3: Off-topic fluent answer
    # Grammatically correct, on a related topic, but answers a different question.
    # Tests whether the Relevance critic fires independently from Accuracy.
    {
        "input":    "What is a REST API?",
        "output":   "APIs are very popular in the software industry today. Many developers find them useful and the community around them is large and growing.",
        "expected": "FAIL"
    },

    # PASS case 4: Correct concise answer — balances the FAIL-heavy dataset
    {
        "input":    "What is TensorFlow?",
        "output":   "TensorFlow is an open-source machine learning framework developed by Google, used for building and training neural networks.",
        "expected": "PASS"
    },

    # PASS case 5: Correct concise answer
    {
        "input":    "What is Git?",
        "output":   "Git is a distributed version control system that tracks changes in source code and enables collaboration among developers.",
        "expected": "PASS"
    },
]

# Check dataset balance first
print("--- Dataset Balance Check ---")
balance = check_balance(test_cases)

# Run eval on each test case
print("\n--- Running Evaluations ---")
results = []
for tc in test_cases:
    result = graph.invoke({
        "input_text":  tc["input"],
        "output_text": tc["output"],
        "run_type":    "test"        # keeps this out of production stats
    })
    results.append({
        "expected":  tc["expected"],
        "predicted": result["final_verdict"]
    })

# Precision / Recall / F1
print("\n--- Precision / Recall / F1 ---")
metrics = compute_precision_recall(results)