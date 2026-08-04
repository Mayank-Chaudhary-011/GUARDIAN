import os
import json
from dotenv import load_dotenv
from backend.eval.state import EvalState
from backend.gateway.providers import get_llm

load_dotenv()


def _parse_response(content: str, fallback: dict) -> dict:
    try:
        raw = content.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception:
        return fallback


# ─────────────────────────────────────────────
# CRITIC 1 — ACCURACY
# Checks: Are the facts correct? Any hallucinations?
# Independent of: relevance, completeness
# ─────────────────────────────────────────────
def accuracy_critic(state: EvalState) -> EvalState:
    print("\n[CRITIC-ACCURACY] Evaluating factual correctness...")

    input_text  = state.get("input_text", "")
    output_text = state.get("output_text", "")
    custom_key  = state.get("custom_api_key")

    prompt = f"""You are a strict Factual Accuracy Critic for an AI evaluation system.

Your job is to verify whether the AI output contains factually correct information.

QUESTION ASKED:
{input_text}

AI OUTPUT TO EVALUATE:
{output_text}

EVALUATION CRITERIA:
- Are all factual claims in the output verifiably correct?
- Are there any hallucinated facts, names, dates, or statistics?
- Does the output contradict well-established knowledge?
- Are technical terms used correctly?

SCORING GUIDE:
5 = All facts are correct. No hallucinations detected.
4 = Mostly correct. One minor inaccuracy that does not mislead.
3 = Partially correct. Contains a mix of accurate and inaccurate facts.
2 = Mostly inaccurate. Core claims are wrong.
1 = Completely wrong or entirely hallucinated.

IMPORTANT:
- Only evaluate factual accuracy. Ignore grammar, style, relevance, or completeness.
- Be strict. If a fact cannot be verified, flag it as an issue.

Return ONLY valid JSON. No Markdown formatting. No backticks.
{{
    "accuracy_score": <int 1-5>,
    "issues": ["<issue 1>", "<issue 2>"]
}}"""

    llm = get_llm(custom_key, model_type="eval")
    response = llm.invoke(prompt)
    fallback = {"accuracy_score": 3, "issues": ["Factual accuracy evaluation failed"]}
    parsed   = _parse_response(response.content, fallback)

    print(f"[CRITIC-ACCURACY] Score: {parsed.get('accuracy_score', 3)}/5")
    for issue in parsed.get("issues", []):
        print(f"[CRITIC-ACCURACY] Issue: {issue}")

    return {
        "accuracy_score":  parsed.get("accuracy_score", 3),
        "accuracy_issues": parsed.get("issues", [])
    }


# ─────────────────────────────────────────────
# CRITIC 2 — RELEVANCE
# Checks: Did it answer what was asked? Stay on topic?
# Independent of: accuracy, completeness
# ─────────────────────────────────────────────
def relevance_critic(state: EvalState) -> EvalState:
    print("\n[CRITIC-RELEVANCE] Evaluating relevance to user prompt...")

    input_text  = state.get("input_text", "")
    output_text = state.get("output_text", "")
    custom_key  = state.get("custom_api_key")

    prompt = f"""You are a strict Relevance Critic for an AI evaluation system.

Your job is to check if the AI output directly answers what the user asked.

QUESTION ASKED:
{input_text}

AI OUTPUT TO EVALUATE:
{output_text}

EVALUATION CRITERIA:
- Does the output directly address the user's core intent?
- Does it contain off-topic tangents or unprompted rambling?
- Did it follow any structural constraints in the prompt? (e.g. "in 3 bullet points")
- Is any section of the response completely irrelevant?

SCORING GUIDE:
5 = Directly answers the prompt. Zero fluff, fully aligned with intent.
4 = Answers the prompt well. Minor irrelevant sentence or preamble.
3 = Partially relevant. Addresses the topic but misses the specific question asked.
2 = Mostly irrelevant. Goes off on a tangent, misses the core request.
1 = Completely irrelevant. Does not address the prompt at all.

IMPORTANT:
- Only evaluate relevance. Assume the facts in the output are correct.
- Penalize heavily if the AI answers a different question than what was asked.

Return ONLY valid JSON. No Markdown formatting. No backticks.
{{
    "relevance_score": <int 1-5>,
    "issues": ["<issue 1>", "<issue 2>"]
}}"""

    llm = get_llm(custom_key, model_type="eval")
    response = llm.invoke(prompt)
    fallback = {"relevance_score": 3, "issues": ["Relevance evaluation failed"]}
    parsed   = _parse_response(response.content, fallback)

    print(f"[CRITIC-RELEVANCE] Score: {parsed.get('relevance_score', 3)}/5")
    for issue in parsed.get("issues", []):
        print(f"[CRITIC-RELEVANCE] Issue: {issue}")

    return {
        "relevance_score":  parsed.get("relevance_score", 3),
        "relevance_issues": parsed.get("issues", [])
    }


# ─────────────────────────────────────────────
# CRITIC 3 — COMPLETENESS
# Checks: Are all key sub-questions answered?
# Independent of: accuracy, relevance
# Calibrates strictness based on question_type.
# ─────────────────────────────────────────────
def completeness_critic(state: EvalState) -> EvalState:
    print("\n[CRITIC-COMPLETENESS] Evaluating answer completeness...")

    input_text    = state.get("input_text", "")
    output_text   = state.get("output_text", "")
    question_type = state.get("question_type", "factual")
    custom_key    = state.get("custom_api_key")

    calibrations = {
        "factual":    "Expect a concise direct answer. Do NOT penalize for brevity if the fact is delivered.",
        "detailed":   "Expect step-by-step detail, code examples if applicable, and deep context. Penalize missing steps.",
        "analytical": "Expect pros/cons, trade-offs, and clear comparison points. Penalize shallow surface-level answers."
    }
    calibration_guide = calibrations.get(question_type, calibrations["factual"])

    prompt = f"""You are a strict Completeness Critic for an AI evaluation system.

Your job is to check if the AI output fully covers everything requested.

QUESTION ASKED:
{input_text}

QUESTION TYPE DETECTED: {question_type.upper()}
CALIBRATION GUIDE: {calibration_guide}

AI OUTPUT TO EVALUATE:
{output_text}

EVALUATION CRITERIA:
- Are all parts of a multi-part question answered?
- Is key necessary context or code missing?
- Is the answer cut off mid-sentence?
- Does it leave obvious follow-up questions unaddressed?

SCORING GUIDE:
5 = Fully complete. Every implicit and explicit requirement answered.
4 = Mostly complete. One minor detail missing that user could easily infer.
3 = Moderately complete. Covers main point but leaves out important sub-points.
2 = Incomplete. Missed major parts of the prompt.
1 = Barely started or severely cut off.

IMPORTANT:
- Only evaluate completeness. Assume the facts present are accurate and relevant.

Return ONLY valid JSON. No Markdown formatting. No backticks.
{{
    "completeness_score": <int 1-5>,
    "issues": ["<issue 1>", "<issue 2>"]
}}"""

    llm = get_llm(custom_key, model_type="eval")
    response = llm.invoke(prompt)
    fallback = {"completeness_score": 3, "issues": ["Completeness evaluation failed"]}
    parsed   = _parse_response(response.content, fallback)

    print(f"[CRITIC-COMPLETENESS] Score: {parsed.get('completeness_score', 3)}/5")
    for issue in parsed.get("issues", []):
        print(f"[CRITIC-COMPLETENESS] Issue: {issue}")

    return {
        "completeness_score":  parsed.get("completeness_score", 3),
        "completeness_issues": parsed.get("issues", [])
    }