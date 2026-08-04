import re
from typing import Optional

# ─────────────────────────────────────────────
# Prompt Injection & Credential Extraction Guard
#
# Runs BEFORE any LLM call is made.
# Zero tokens wasted on blocked requests.
#
# Two threat classes:
#   1. Instruction overrides — trying to make the LLM ignore its role
#   2. Credential extraction — trying to get API keys / secrets returned
# ─────────────────────────────────────────────

_INJECTION_PATTERNS = [
    # Instruction override attempts
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?",
    r"disregard\s+(all\s+)?(previous|prior|above)\s+instructions?",
    r"forget\s+(your|all|the)\s+instructions?",
    r"override\s+(your\s+)?(instructions?|rules?|guidelines?)",
    r"you\s+are\s+now\s+(a|an|the)\b",
    r"pretend\s+(you\s+are|to\s+be)",
    r"act\s+as\s+(if\s+)?(you\s+)?(have\s+no|don'?t\s+have)\s+restrictions?",
    r"from\s+now\s+on[,\s]",
    r"new\s+(persona|role|instructions?)",
    r"\bjailbreak\b",
    r"\bdan\s+mode\b",        # "Do Anything Now"
    r"\bdeveloper\s+mode\b",
    r"system\s+prompt",

    # Credential extraction attempts
    r"(reveal|show|print|output|give\s+me|return|tell\s+me|what\s+is)\s+(your\s+)?(api[_\s]?key|password|secret|token|credential|private\s+key)",
    r"openai[_\s]?api[_\s]?key",
    r"groq[_\s]?api[_\s]?key",
    r"supabase[_\s]?(url|key)",
    r"sk-[a-zA-Z0-9]{20,}",          # OpenAI key pattern appearing in output
    r"\bOPENAI_API_KEY\b",
    r"\bGROQ_API_KEY\b",
    r"\.env\b",

    # Safety bypass
    r"remove\s+(all\s+)?(safety|restrictions?|guardrails?|filters?|limits?)",
    r"bypass\s+(safety|restrictions?|filters?|security)",
    r"disable\s+(safety|restrictions?|filters?)",
    r"(your\s+)?(previous\s+)?instructions?\s+(are\s+)?(void|null|invalid|cancelled|lifted)",
    r"(no\s+)?restrictions?\s+apply",
]

# Compile once at import time for performance
_COMPILED_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in _INJECTION_PATTERNS
]


def detect_injection(text: str) -> Optional[str]:
    """
    Scans a string for known injection patterns.
    Returns the matched pattern string if found, None if clean.
    """
    for compiled in _COMPILED_PATTERNS:
        if compiled.search(text):
            return compiled.pattern
    return None


def check_request(input_text: str, output_text: str) -> dict:
    """
    Validates both fields before the eval graph runs.

    Returns:
        {
            "is_safe": bool,
            "flagged_field": "input_text" | "output_text" | None,
            "reason": str | None
        }
    """
    input_match = detect_injection(input_text)
    if input_match:
        return {
            "is_safe":       False,
            "flagged_field": "input_text",
            "reason":        "Prompt injection or instruction override detected in input"
        }

    output_match = detect_injection(output_text)
    if output_match:
        return {
            "is_safe":       False,
            "flagged_field": "output_text",
            "reason":        "Credential pattern or injection attempt detected in output"
        }

    return {"is_safe": True, "flagged_field": None, "reason": None}
