import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


def save_eval_run(state: dict, tokens_used: int = 0, tokens_saved: int = 0, provider: str = "openai") -> None:
    run_type = state.get("run_type", "production")
    try:
        supabase.table("eval_runs").insert({
            "input_text":         state.get("input_text", ""),
            "output_text":        state.get("output_text", ""),
            "accuracy_score":     state.get("accuracy_score", 0),
            # DB column still named logic_score for schema compat — stores relevance score
            "logic_score":        state.get("relevance_score", 0),
            "completeness_score": state.get("completeness_score", 0),
            "final_score":        state.get("final_score", 0.0),
            "final_verdict":      state.get("final_verdict", ""),
            "confidence":         state.get("confidence", 0.0),
            "issues":             json.dumps(state.get("issues", [])),
            "tokens_used":        tokens_used,
            "tokens_saved":       tokens_saved,
            "provider":           provider,
            "run_type":           run_type,          # "production" | "test" | "redteam"
        }).execute()
        print(f"[MEMORY] Eval run saved to Supabase. [run_type={run_type}]")
    except Exception as e:
        print(f"[MEMORY] Failed to save: {e}")


def get_recent_runs(limit: int = 10, run_type: str = "production") -> list:
    """
    Fetches recent runs filtered by run_type.
    Default is "production" — this keeps test and red team runs
    out of the stats so the numbers are meaningful.
    """
    try:
        result = supabase.table("eval_runs")\
            .select("*")\
            .eq("run_type", run_type)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        return result.data
    except Exception as e:
        print(f"[MEMORY] Failed to fetch: {e}")
        return []


def get_pass_rate(limit: int = 10) -> float:
    """% of production runs that passed in the last N runs."""
    runs = get_recent_runs(limit, run_type="production")
    if not runs:
        return 0.0
    total  = len(runs)
    passed = sum(1 for r in runs if r.get("final_verdict") == "PASS")
    return round(passed / total * 100, 1)


def get_average_score(limit: int = 10) -> float:
    """
    Average final_score for PASS production runs only.
    Excludes FAIL scores (they drag the avg down when caught correctly)
    and excludes test/redteam runs (they are intentionally full of FAILs).
    """
    runs = get_recent_runs(limit, run_type="production")
    if not runs:
        return 0.0
    pass_scores = [
        r["final_score"] for r in runs
        if r.get("final_verdict") == "PASS" and r["final_score"]
    ]
    return round(sum(pass_scores) / len(pass_scores), 2) if pass_scores else 0.0