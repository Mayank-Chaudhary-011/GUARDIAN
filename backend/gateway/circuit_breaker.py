import pybreaker
import logging

logger = logging.getLogger(__name__)


# Circuit breaker for each provider
# Opens after 3 failures, resets after 30 seconds

openai_breaker = pybreaker.CircuitBreaker(
    fail_max=3,
    reset_timeout=30,
    name="openai"
)

groq_breaker = pybreaker.CircuitBreaker(
    fail_max=3,
    reset_timeout=30,
    name="groq"
)

ollama_breaker = pybreaker.CircuitBreaker(
    fail_max=3,
    reset_timeout=30,
    name="ollama"
)

BREAKERS = {
    "openai": openai_breaker,
    "groq":   groq_breaker,
    "ollama": ollama_breaker
}