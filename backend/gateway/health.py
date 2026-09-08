import os
import logging
import httpx
from datetime import datetime
from backend.gateway.circuit_breaker import BREAKERS

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Why not use llm.invoke() for health checks?
# Because that costs real tokens on every poll.
# Instead:
#   - OpenAI / Groq  → HTTP GET to the models list endpoint (free, no completion)
#   - Ollama         → HTTP GET to localhost:11434 (lightweight local ping)
# ─────────────────────────────────────────────

PROVIDER_HEALTH_ENDPOINTS = {
    "nvidia": {
        "url":     "https://integrate.api.nvidia.com/v1/models",
        "headers": lambda: {"Authorization": f"Bearer {os.getenv('NVIDIA_API_KEY', '')}"}
    },
    "openai": {
        "url":     "https://api.openai.com/v1/models",
        "headers": lambda: {"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY', '')}"}
    },
    "groq": {
        "url":     "https://api.groq.com/openai/v1/models",
        "headers": lambda: {"Authorization": f"Bearer {os.getenv('GROQ_API_KEY', '')}"}
    },
    "ollama": {
        "url":     "http://localhost:11434/",
        "headers": lambda: {}
    }
}


async def check_provider_health(provider_name: str) -> dict:
    config = PROVIDER_HEALTH_ENDPOINTS.get(provider_name)
    if not config:
        return {"provider": provider_name, "status": "unknown", "checked_at": datetime.now().isoformat()}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                config["url"],
                headers=config["headers"]()
            )

        if response.status_code in (200, 401):
            # 401 means the key is wrong, but the service is UP
            # We still count it as reachable
            status = "up" if response.status_code == 200 else "key_invalid"
        else:
            status = "degraded"

    except httpx.ConnectError:
        status = "down"
    except httpx.TimeoutException:
        status = "timeout"
    except Exception as e:
        status = "error"
        logger.warning(f"[HEALTH] {provider_name} check failed: {e}")

    return {
        "provider":   provider_name,
        "status":     status,
        "circuit":    BREAKERS[provider_name].current_state,
        "checked_at": datetime.now().isoformat()
    }


async def check_all_providers() -> dict:
    results = {}
    for provider in ["nvidia", "openai", "groq", "ollama"]:
        results[provider] = await check_provider_health(provider)
    return results