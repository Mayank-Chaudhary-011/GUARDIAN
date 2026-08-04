import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama

load_dotenv()

def get_openai():
    return ChatOpenAI(
        model="gpt-4o-mini",
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.7
    )

def get_groq():
    return ChatGroq(
        model="llama-3.1-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7
    )

def get_ollama():
    return ChatOllama(
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        model=os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
        temperature=0.7
    )

PROVIDERS = {
    "openai": get_openai,
    "groq":   get_groq,
    "ollama": get_ollama   # kept for local dev only — not in production chain
}

# Production fallback chain: OpenAI → Groq
# Ollama is intentionally excluded — it runs inference on the host machine
# and cannot handle concurrent user requests in production.
# To enable it locally for dev: add "ollama" to this list.
FALLBACK_CHAIN = ["openai", "groq"]