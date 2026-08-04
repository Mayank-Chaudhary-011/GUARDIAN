import os
import json
from typing import List
from backend.memory.supabase_memory import save_eval_run, get_average_score, get_pass_rate
from backend.memory.token_optimizer import optimize_eval_inputs, count_tokens_approx
from backend.alerts.monitor import check_and_alert
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from backend.eval.state import EvalState
from backend.eval.critics import (
    accuracy_critic,
    relevance_critic,
    completeness_critic
)

from backend.gateway.providers import get_llm


# ─────────────────────────────────────────────
# PREPROCESSING
# Runs before any critic. Infers question_type so
# the completeness critic calibrates correctly.
# Also applies token optimizer to prevent oversized
# prompts hitting the critics.
# ─────────────────────────────────────────────
def _infer_question_type(input_text: str) -> str:
    text = input_text.lower().strip()
    if any(k in text for k in ["explain", "how does", "how do", "describe", "elaborate", "in detail", "walk me through"]):
        return "detailed"
    elif any(k in text for k in ["why", "analyze", "compare", "evaluate", "what are the differences", "pros and cons"]):
        return "analytical"
    return "factual"


def preprocess(state: EvalState) -> EvalState:
    input_text  = state.get("input_text", "")
    output_text = state.get("output_text", "")

    tokens_est = count_tokens_approx(input_text) + count_tokens_approx(output_text)
    opt_input, opt_output, saved = optimize_eval_inputs(input_text, output_text)
    if saved > 0:
        print(f"[TOKEN-OPT] Truncated inputs — saved {saved} tokens before eval")

    question_type = _infer_question_type(input_text)

    return {
        "input_text":    opt_input,
        "output_text":   opt_output,
        "question_type": question_type,
        "tokens_est":    tokens_est,
        "tokens_saved":  saved
    }


# ─────────────────────────────────────────────
# ISSUE DEDUPLICATION
# Critics can flag the same issue in different words.
# This removes exact duplicates before the adjudicator
# sees the list, reducing noise.
# ─────────────────────────────────────────────
def _deduplicate_issues(issues: List[str]) -> List[str]:
    seen = set()
    unique = []
    for issue in issues:
        key = issue.lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(issue)
    return unique


# ─────────────────────────────────────────────
# ADJUDICATOR
# Receives 3 independent critic scores + deduplicated
# issues. Returns the final verdict.
# ─────────────────────────────────────────────
def adjudicator(state: EvalState) -> EvalState:
    print("\n[ADJUDICATOR] Resolving all critic verdicts...")

    acc  = state.get("accuracy_score",     3)
    rel  = state.get("relevance_score",    3)
    comp = state.get("completeness_score", 3)

    acc_issues  = state.get("accuracy_issues",    [])
    rel_issues  = state.get("relevance_issues",   [])
    comp_issues = state.get("completeness_issues", [])

    # Deduplicate before passing to LLM
    all_issues = _deduplicate_issues(acc_issues + rel_issues + comp_issues)

    prompt = f"""You are the Adjudicator in a multi-critic AI evaluation system.

Three specialized critics have independently evaluated an AI output.
Your job is to weigh their verdicts, resolve any disagreements,
and return a single final quality verdict.

CRITIC SCORES:
- Accuracy Critic:     {acc}/5  | Issues: {acc_issues}
- Relevance Critic:    {rel}/5  | Issues: {rel_issues}
- Completeness Critic: {comp}/5 | Issues: {comp_issues}

ADJUDICATION RULES:
1. If all three critics score 4 or 5 → final verdict is PASS
2. If accuracy or relevance scores 1 or 2 → final verdict is FAIL (severe failure)
3. If accuracy scores 3 AND the issues list contains confirmed factual errors → final verdict is FAIL.
   Reason: a score of 3 means partially wrong. Partial factual errors are still errors.
4. If scores are mixed (some 3s, some 4s) with no confirmed factual errors → weigh severity
5. Completeness gaps alone (accuracy+relevance both ≥ 4) → PASS with noted issues
6. DEDUPLICATION REQUIRED: Merge issues that say the same thing in different words.
   Return only distinct, non-overlapping issues in your final list.

Return ONLY valid JSON. No explanation. No markdown.
{{
    "final_score": <float 1.0-5.0>,
    "confidence": <float 0.0-1.0>,
    "final_verdict": "<PASS or FAIL>",
    "issues": ["<unique confirmed issue 1>", "<unique confirmed issue 2>"],
    "reasoning": "<one sentence explaining the verdict>"
}}"""

    llm = get_llm(state.get("custom_api_key"), model_type="primary")
    response = llm.invoke(prompt)

    try:
        raw  = response.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)
    except Exception:
        avg  = round((acc + rel + comp) / 3, 2)
        data = {
            "final_score":   avg,
            "confidence":    0.6,
            "final_verdict": "PASS" if avg >= 3.5 else "FAIL",
            "issues":        all_issues,
            "reasoning":     "Fallback — could not parse adjudicator response"
        }

    print(f"[ADJUDICATOR] Final Score : {data['final_score']}/5")
    print(f"[ADJUDICATOR] Verdict     : {data['final_verdict']}")
    print(f"[ADJUDICATOR] Confidence  : {data['confidence']}")
    print(f"[ADJUDICATOR] Reasoning   : {data.get('reasoning', '')}")
    if data["issues"]:
        print("[ADJUDICATOR] Confirmed issues:")
        for issue in data["issues"]:
            print(f"  -> {issue}")

    return {
        "final_score":   data["final_score"],
        "confidence":    data["confidence"],
        "final_verdict": data["final_verdict"],
        "issues":        data["issues"],
        "reasoning":     data.get("reasoning", "")
    }


# ─────────────────────────────────────────────
# SAVE & LOG
# Persists to Supabase. Now logs two separate
# metrics: avg score (PASS runs only) + pass rate %.
# ─────────────────────────────────────────────
def save_and_log(state: EvalState) -> EvalState:
    run_type    = state.get("run_type", "production")
    tokens_used = count_tokens_approx(
        state.get("input_text", "") + state.get("output_text", "")
    )
    save_eval_run(state, tokens_used=tokens_used)

    # Only show stats and trigger monitor on production runs.
    # Test and redteam runs are full of intentional FAILs — don't alert on them.
    if run_type == "production":
        avg       = get_average_score(limit=10)
        pass_rate = get_pass_rate(limit=10)
        print(f"\n[MEMORY] Avg score on PASS runs (last 10): {avg}/5")
        print(f"[MEMORY] Pass rate (last 10 runs)        : {pass_rate}%")
        check_and_alert(limit=10)
    else:
        print(f"\n[MEMORY] Run type: {run_type} — stats and monitor skipped")

    return state


# ─────────────────────────────────────────────
# GRAPH
# Pipeline: preprocess → accuracy → relevance →
#           completeness → adjudicator → save
# ─────────────────────────────────────────────
def build_eval_graph():
    builder = StateGraph(EvalState)

    builder.add_node("preprocess",          preprocess)
    builder.add_node("accuracy_critic",     accuracy_critic)
    builder.add_node("relevance_critic",    relevance_critic)
    builder.add_node("completeness_critic", completeness_critic)
    builder.add_node("adjudicator",         adjudicator)
    builder.add_node("save_and_log",        save_and_log)

    builder.set_entry_point("preprocess")
    builder.add_edge("preprocess",          "accuracy_critic")
    builder.add_edge("accuracy_critic",     "relevance_critic")
    builder.add_edge("relevance_critic",    "completeness_critic")
    builder.add_edge("completeness_critic", "adjudicator")
    builder.add_edge("adjudicator",         "save_and_log")
    builder.add_edge("save_and_log",        END)

    return builder.compile()