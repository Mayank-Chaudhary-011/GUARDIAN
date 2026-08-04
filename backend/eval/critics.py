import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from backend.eval.state import EvalState

load_dotenv()

llm = ChatOpenAI(
    model=os.getenv("EVAL_MODEL", "gpt-4o-mini"),
    api_key=os.getenv("OPENAI_API_KEY"),
    temperature=0
)


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
- passed = true only if score is 4 or 5.

Return ONLY valid JSON. No explanation. No markdown.
{{"score": <int 1-5>, "issues": ["<specific issue 1>", "<specific issue 2>"], "passed": <bool>}}"""

    response = llm.invoke(prompt)
    data = _parse_response(
        response.content,
        fallback={"score": 3, "issues": ["Could not parse accuracy verdict"], "passed": False}
    )

    print(f"[CRITIC-ACCURACY] Score: {data['score']}/5 | Passed: {data['passed']}")
    if data["issues"]:
        for issue in data["issues"]:
            print(f"  -> {issue}")

    return {
        "accuracy_score":  data["score"],
        "accuracy_issues": data["issues"]
    }


# ─────────────────────────────────────────────
# CRITIC 2 — RELEVANCE  (replaces Logic)
# Checks: Does the answer address THIS specific question?
# Why this matters: A response can be factually correct but
# answer a completely different question. Accuracy won't catch
# that. Relevance is a genuinely independent signal.
# ─────────────────────────────────────────────
def relevance_critic(state: EvalState) -> EvalState:
    print("\n[CRITIC-RELEVANCE] Evaluating relevance to question...")

    input_text  = state.get("input_text", "")
    output_text = state.get("output_text", "")

    prompt = f"""You are a strict Relevance Critic for an AI evaluation system.

Your job is to verify whether the AI output directly addresses the specific question asked.

QUESTION ASKED:
{input_text}

AI OUTPUT TO EVALUATE:
{output_text}

EVALUATION CRITERIA:
- Does the output answer THIS specific question, not a different one?
- Is the response on-topic and directly related to what was asked?
- Does it avoid answering a related but different question?
- Is the response free from irrelevant tangents or deflection?
- Would a user reading only this output feel their specific question was answered?

SCORING GUIDE:
5 = Directly and fully on-topic. Answers exactly what was asked.
4 = Mostly on-topic. One minor tangent that does not detract from the answer.
3 = Partially relevant. Addresses a related topic but not the specific question asked.
2 = Mostly off-topic. Talks around the subject without answering.
1 = Completely irrelevant. Does not address the question at all.

IMPORTANT:
- Only evaluate relevance. Ignore factual accuracy or completeness.
- A short, focused answer can score 5. A long, wandering answer can score 1.
- passed = true only if score is 4 or 5.

Return ONLY valid JSON. No explanation. No markdown.
{{"score": <int 1-5>, "issues": ["<specific issue 1>", "<specific issue 2>"], "passed": <bool>}}"""

    response = llm.invoke(prompt)
    data = _parse_response(
        response.content,
        fallback={"score": 3, "issues": ["Could not parse relevance verdict"], "passed": False}
    )

    print(f"[CRITIC-RELEVANCE] Score: {data['score']}/5 | Passed: {data['passed']}")
    if data["issues"]:
        for issue in data["issues"]:
            print(f"  -> {issue}")

    return {
        "relevance_score":  data["score"],
        "relevance_issues": data["issues"]
    }


# ─────────────────────────────────────────────
# CRITIC 3 — COMPLETENESS
# Checks: Does the answer cover what the question requires?
# Key fix: calibrates to question_type so a brief factual
# answer ("What is Python?") is not penalized for lacking
# ecosystem documentation.
# ─────────────────────────────────────────────
def completeness_critic(state: EvalState) -> EvalState:
    print("\n[CRITIC-COMPLETENESS] Evaluating completeness...")

    input_text    = state.get("input_text", "")
    output_text   = state.get("output_text", "")
    question_type = state.get("question_type", "factual")

    calibration_notes = {
        "factual":    "This is a simple factual or definition question. A concise, accurate answer is SUFFICIENT. Do NOT penalize for not being encyclopedic. A single correct sentence can score 4 or 5.",
        "detailed":   "This question explicitly asks for depth or explanation. Expect comprehensive coverage of all aspects.",
        "analytical": "This question requires reasoning, comparison, or evaluation. Expect structured analysis with supporting points."
    }.get(question_type, "Evaluate completeness relative to what the question reasonably requires.")

    prompt = f"""You are a strict Completeness Critic for an AI evaluation system.

Your job is to verify whether the AI output fully addresses everything asked in the question.

QUESTION ASKED:
{input_text}

AI OUTPUT TO EVALUATE:
{output_text}

QUESTION TYPE: {question_type}
CALIBRATION NOTE: {calibration_notes}

EVALUATION CRITERIA:
- Does the output address ALL parts of the question?
- Are there sub-questions or implicit requirements that were ignored?
- Is the response detailed enough for the COMPLEXITY and TYPE of this question?
- Does it stop too early or leave important aspects unexplained?
- Would a user still have unanswered questions after reading this output?

SCORING GUIDE:
5 = Fully addresses every part of the question. Nothing missing.
4 = Addresses most parts. One minor aspect missing but core answer is complete.
3 = Partially complete. Addresses the main question but misses important sub-parts.
2 = Mostly incomplete. Answers only a fraction of what was asked.
1 = Does not address the question at all.

IMPORTANT:
- Only evaluate completeness. Ignore factual accuracy or relevance.
- Calibrate your expectations to the question type above.
- passed = true only if score is 4 or 5.

Return ONLY valid JSON. No explanation. No markdown.
{{"score": <int 1-5>, "issues": ["<specific issue 1>", "<specific issue 2>"], "passed": <bool>}}"""

    response = llm.invoke(prompt)
    data = _parse_response(
        response.content,
        fallback={"score": 3, "issues": ["Could not parse completeness verdict"], "passed": False}
    )

    print(f"[CRITIC-COMPLETENESS] Score: {data['score']}/5 | Passed: {data['passed']}")
    if data["issues"]:
        for issue in data["issues"]:
            print(f"  -> {issue}")

    return {
        "completeness_score":  data["score"],
        "completeness_issues": data["issues"]
    }