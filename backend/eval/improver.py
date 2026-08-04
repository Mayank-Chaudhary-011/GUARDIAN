from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage
from backend.gateway.providers import PROVIDERS, FALLBACK_CHAIN

load_dotenv()

IMPROVE_SYSTEM = """You are an expert AI response editor.
Given an AI response that FAILED a quality evaluation, rewrite it to fix every issue listed.

Rules:
- Address each issue directly with high accuracy
- Be concise, direct, and token-efficient — eliminate fluff and unnecessary preambles while delivering high quality
- Return ONLY the improved response text — no preamble, no explanation, no quotes
"""


def improve_output(input_text: str, output_text: str, issues: list) -> str:
    """
    Rewrites a failing AI output to fix detected quality issues while optimizing for token efficiency.
    Uses the production fallback chain (OpenAI -> Groq).
    """
    issues_text = "\n".join(f"- {issue}" for issue in issues) if issues else "- General quality improvement needed"

    user_prompt = f"""Original question asked to the AI:
{input_text}

Original AI response (FAILED quality evaluation):
{output_text}

Issues identified by the evaluation:
{issues_text}

Rewrite the AI response to fix all the issues above concisely and accurately."""

    messages = [
        SystemMessage(content=IMPROVE_SYSTEM),
        HumanMessage(content=user_prompt)
    ]

    for provider_name in FALLBACK_CHAIN:
        try:
            llm = PROVIDERS[provider_name]()
            response = llm.invoke(messages)
            return response.content.strip()
        except Exception as exc:
            print(f"[IMPROVER] {provider_name} failed: {exc}")
            continue

    raise RuntimeError("All providers failed in improver — check API keys")
