import os
import logging
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama

load_dotenv()

logger = logging.getLogger(__name__)

NVIDIA_BASE_URL  = "https://integrate.api.nvidia.com/v1"
DEFAULT_NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct")

# ─────────────────────────────────────────────
# NVIDIA KEY VALIDATION
#
# At server startup we do a cheap, non-completion call to verify
# that the NVIDIA key actually has access to the hosted NIM endpoint.
# If it returns 404 (account doesn't have NIM access) or any other
# error, we permanently disable the NVIDIA provider for this process
# so every invocation silently falls back to OpenAI.
# This means:
#   • No 404 errors ever reach the frontend.
#   • Zero extra latency per request (check only runs once at boot).
# ─────────────────────────────────────────────
_nvidia_available: bool | None = None  # None = not yet checked


def _check_nvidia_available() -> bool:
    """
    Sends a minimal 1-token ChatCompletion to the NVIDIA NIM endpoint.
    Returns True if the key + model are both accessible, False otherwise.
    Cached in _nvidia_available so it only runs once per server process.
    """
    global _nvidia_available
    if _nvidia_available is not None:
        return _nvidia_available

    nvidia_key = os.getenv("NVIDIA_API_KEY", "").strip()
    if not nvidia_key:
        _nvidia_available = False
        logger.info("[PROVIDERS] NVIDIA_API_KEY not set — skipping NVIDIA provider.")
        return False

    try:
        from openai import OpenAI as _OpenAI
        client = _OpenAI(api_key=nvidia_key, base_url=NVIDIA_BASE_URL)
        client.chat.completions.create(
            model=DEFAULT_NVIDIA_MODEL,
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=1,
            timeout=8
        )
        _nvidia_available = True
        logger.info(f"[PROVIDERS] ✅ NVIDIA NIM validated — model: {DEFAULT_NVIDIA_MODEL}")
    except Exception as exc:
        _nvidia_available = False
        logger.warning(
            f"[PROVIDERS] ⚠️  NVIDIA key present but endpoint not accessible "
            f"({type(exc).__name__}: {str(exc)[:120]}). "
            f"Falling back to OpenAI automatically."
        )

    return _nvidia_available


def is_nvidia_available() -> bool:
    """Public helper for health endpoint and routes."""
    return _check_nvidia_available()


def get_nvidia(api_key: str = None, model: str = None, temperature: float = 0.0):
    key = api_key or os.getenv("NVIDIA_API_KEY")
    return ChatOpenAI(
        model=model or DEFAULT_NVIDIA_MODEL,
        api_key=key,
        base_url=NVIDIA_BASE_URL,
        temperature=temperature
    )


def get_openai(api_key: str = None, model: str = "gpt-4o-mini"):
    return ChatOpenAI(
        model=model,
        api_key=api_key or os.getenv("OPENAI_API_KEY"),
        temperature=0.7
    )


def get_groq():
    return ChatGroq(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7
    )


def get_llm(custom_api_key: str = None, model_type: str = "eval"):
    """
    Returns the appropriate LLM instance.

    Priority:
      1. Custom key from browser (nvapi-... → NVIDIA, sk-... → OpenAI).
      2. Server NVIDIA key — ONLY if validated at startup (no 404 risk).
      3. Server OpenAI key.
      4. Server Groq key.

    The NVIDIA pre-flight check (_check_nvidia_available) runs once at
    first request and caches the result, so there is ZERO per-request
    overhead and the frontend will NEVER see a 404 from NVIDIA.
    """
    # ── Custom key from browser ──────────────────────────────────────────
    if custom_api_key and custom_api_key.strip():
        k = custom_api_key.strip()
        if k.startswith("nvapi-"):
            # Browser-supplied NVIDIA key — trust it; user chose this explicitly
            return get_nvidia(api_key=k, temperature=0.0)
        model = "gpt-4o" if model_type == "primary" else "gpt-4o-mini"
        return ChatOpenAI(model=model, api_key=k, temperature=0)

    # ── Server-side NVIDIA (only if actually works) ──────────────────────
    if _check_nvidia_available():
        nvidia_key = os.getenv("NVIDIA_API_KEY", "").strip()
        return get_nvidia(api_key=nvidia_key, temperature=0.0)

    # ── OpenAI fallback ──────────────────────────────────────────────────
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    if openai_key:
        model = "gpt-4o" if model_type == "primary" else "gpt-4o-mini"
        return ChatOpenAI(model=model, api_key=openai_key, temperature=0)

    # ── Groq last resort ─────────────────────────────────────────────────
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_key:
        return ChatGroq(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            api_key=groq_key,
            temperature=0
        )

    raise RuntimeError(
        "No LLM provider is configured. "
        "Set at least one of: NVIDIA_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY."
    )


PROVIDERS = {
    "nvidia": get_nvidia,
    "openai": get_openai,
    "groq":   get_groq,
}

FALLBACK_CHAIN = ["nvidia", "openai", "groq"]