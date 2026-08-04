from typing import List


def check_balance(test_cases: List[dict]) -> dict:
    total      = len(test_cases)
    if total == 0:
        return {"error": "Empty dataset"}

    pass_count = sum(1 for t in test_cases if t.get("expected") == "PASS")
    fail_count = sum(1 for t in test_cases if t.get("expected") == "FAIL")
    pass_pct   = round(pass_count / total * 100, 1)
    fail_pct   = round(fail_count / total * 100, 1)
    balanced   = 0.2 <= fail_count / total <= 0.5

    print(f"\n[DATASET-BALANCE] Total: {total}")
    print(f"[DATASET-BALANCE] PASS:  {pass_count} ({pass_pct}%)")
    print(f"[DATASET-BALANCE] FAIL:  {fail_count} ({fail_pct}%)")

    if not balanced:
        if fail_pct < 20:
            print(f"[DATASET-BALANCE] WARNING: Only {fail_pct}% FAIL cases.")
            print("[DATASET-BALANCE] Add more FAIL examples for reliable regression detection.")
        elif fail_pct > 50:
            print(f"[DATASET-BALANCE] WARNING: {fail_pct}% FAIL cases is too high.")
            print("[DATASET-BALANCE] Add more PASS examples.")
    else:
        print("[DATASET-BALANCE] Dataset is well balanced.")

    return {
        "total":      total,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "pass_pct":   pass_pct,
        "fail_pct":   fail_pct,
        "balanced":   balanced
    }


def compute_precision_recall(results: List[dict]) -> dict:
    tp = sum(1 for r in results if r["expected"] == "FAIL" and r["predicted"] == "FAIL")
    fp = sum(1 for r in results if r["expected"] == "PASS" and r["predicted"] == "FAIL")
    fn = sum(1 for r in results if r["expected"] == "FAIL" and r["predicted"] == "PASS")
    tn = sum(1 for r in results if r["expected"] == "PASS" and r["predicted"] == "PASS")

    precision = round(tp / (tp + fp), 3) if (tp + fp) > 0 else 0.0
    recall    = round(tp / (tp + fn), 3) if (tp + fn) > 0 else 0.0
    f1        = round(2 * precision * recall / (precision + recall), 3) if (precision + recall) > 0 else 0.0
    accuracy  = round((tp + tn) / len(results), 3) if results else 0.0

    print(f"\n[METRICS] Precision : {precision}")
    print(f"[METRICS] Recall    : {recall}")
    print(f"[METRICS] F1 Score  : {f1}")
    print(f"[METRICS] Accuracy  : {accuracy}")
    print(f"[METRICS] TP:{tp} FP:{fp} FN:{fn} TN:{tn}")

    return {
        "precision": precision,
        "recall":    recall,
        "f1":        f1,
        "accuracy":  accuracy,
        "tp": tp, "fp": fp, "fn": fn, "tn": tn
    }