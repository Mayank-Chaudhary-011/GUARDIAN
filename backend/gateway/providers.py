import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama

load_dotenv()

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct")

def get_nvidia(api_key: str = None, model: str = None, temperature: float = 0.0):
    key = api_key or os.getenv("NVIDIA_API_KEY")
    return ChatOpenAI(
        model=model or DEFAULT_NVIDIA_MODEL,
        api_key=key,
        base_url=NVIDIA_BASE_URL,
        temperature=temperature
    )

def get_llm(custom_api_key: str = None, model_type: str = "eval"):
    """
    Returns the appropriate LLM instance:
    - If custom_api_key is provided:
        - Starts with 'nvapi-' -> Use NVIDIA Nemotron with custom key.
        - Otherwise -> Use OpenAI with custom key.
    - Default server keys:
        - If NVIDIA_API_KEY is configured -> Use NVIDIA Nemotron (nvidia/llama-3.1-nemotron-70b-instruct).
        - If GROQ_API_KEY is configured -> Use Groq.
        - Fallback -> OpenAI server environment key.
    """
    if custom_api_key and custom_api_key.strip():
        k = custom_api_key.strip()
        if k.startswith("nvapi-"):
            return get_nvidia(api_key=k, temperature=0.0)
        model = "gpt-4o" if model_type == "primary" else "gpt-4o-mini"
        return ChatOpenAI(
            model=model,
            api_key=k,
            temperature=0
        )
    
    nvidia_key = os.getenv("NVIDIA_API_KEY")
    if nvidia_key and nvidia_key.strip():
        return get_nvidia(api_key=nvidia_key.strip(), temperature=0.0)

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and openai_key.strip():
        model = "gpt-4o" if model_type == "primary" else "gpt-4o-mini"
        return ChatOpenAI(
            model=model,
            api_key=openai_key.strip(),
            temperature=0
        )

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key.strip():
        return ChatGroq(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            api_key=groq_key.strip(),
            temperature=0
        )
    
    return ChatOpenAI(
        model="gpt-4o-mini",
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0
    )

def get_openai(api_key: str = None):
    return ChatOpenAI(
        model="gpt-4o-mini",
        api_key=api_key or os.getenv("OPENAI_API_KEY"),
        temperature=0.7
    )

def get_groq():
    return ChatGroq(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7
    )

PROVIDERS = {
    "nvidia": get_nvidia,
    "openai": get_openai,
    "groq":   get_groq,
}

FALLBACK_CHAIN = ["nvidia", "openai", "groq"]