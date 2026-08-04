
import logging
from datetime import datetime
from backend.gateway.providers import PROVIDERS, FALLBACK_CHAIN
from backend.gateway.circuit_breaker import BREAKERS
import pybreaker

logger = logging.getLogger(__name__)

# Track provider health
provider_status = {
    "openai": {"status": "up", "last_checked": None, "failures": 0},
    "groq":   {"status": "up", "last_checked": None, "failures": 0},
    "ollama": {"status": "up", "last_checked": None, "failures": 0}
}

def route_request(prompt: str) -> dict:
    for provider_name in FALLBACK_CHAIN:
        breaker = BREAKERS[provider_name]
        get_llm = PROVIDERS[provider_name]

        try:
            print(f"[GATEWAY] Trying {provider_name}...")

            @breaker
            def call_provider():
                llm = get_llm()
                response = llm.invoke(prompt)
                return response.content

            result = call_provider()

            # Update status
            provider_status[provider_name]["status"]       = "up"
            provider_status[provider_name]["last_checked"] = datetime.now().isoformat()
            provider_status[provider_name]["failures"]     = 0

            print(f"[GATEWAY] Success via {provider_name}")

            return {
                "provider":  provider_name,
                "response":  result,
                "success":   True,
                "timestamp": datetime.now().isoformat()
            }

        except pybreaker.CircuitBreakerError:
            print(f"[GATEWAY] {provider_name} circuit OPEN — skipping")
            provider_status[provider_name]["status"] = "circuit_open"
            continue

        except Exception as e:
            print(f"[GATEWAY] {provider_name} failed: {e}")
            provider_status[provider_name]["status"]   = "down"
            provider_status[provider_name]["failures"] += 1
            continue

    return {
        "provider":  None,
        "response":  None,
        "success":   False,
        "error":     "All providers failed",
        "timestamp": datetime.now().isoformat()
    }


def get_provider_status() -> dict:
    return provider_status