from dotenv import load_dotenv
load_dotenv()

from backend.eval.graph import build_eval_graph
from backend.memory.dataset_balance import compute_precision_recall
from backend.redteam.adversarial import ADVERSARIAL_CASES

graph = build_eval_graph()

# NOTE: This runner calls graph.invoke() directly — it intentionally bypasses
# the API security gate in routes.py. Red team inputs are supposed to be
# adversarial. In production, all external requests go through /eval first.


def run_redteam():
    print("=== GUARDIAN — RED TEAM RUN ===\n")
    results = []

    for case in ADVERSARIAL_CASES:
        print(f"\n[REDTEAM] Case: {case['name']}")
        print(f"[REDTEAM] Note: {case['note']}")

        result = graph.invoke({
            "input_text":  case["input"],
            "output_text": case["output"],
            "run_type":    "redteam"     # keeps this out of production stats
        })

        predicted = result["final_verdict"]
        expected  = case["expected"]
        match     = "✅" if predicted == expected else "❌ MISSED"

        print(f"[REDTEAM] Expected: {expected} | Got: {predicted} {match}")

        results.append({
            "expected":  expected,
            "predicted": predicted
        })

    print("\n--- Red Team Metrics ---")
    compute_precision_recall(results)


if __name__ == "__main__":
    run_redteam()
