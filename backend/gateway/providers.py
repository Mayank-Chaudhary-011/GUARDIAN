import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama

load_dotenv()

def get_llm(custom_openai_key: str = None, model_type: str = "eval"):
    """
    Returns the appropriate LLM instance:
    - If custom_openai_key is provided -> Use OpenAI with custom key.
    - Default -> Use Groq (llama-3.3-70b-versatile) for 100% FREE server usage.
    - Fallback -> OpenAI server environment key if Groq unavailable.
    """
    if custom_openai_key and custom_openai_key.strip():
        model = "gpt-4o" if model_type == "primary" else "gpt-4o-mini"
        return ChatOpenAI(
            model=model,
            api_key=custom_openai_key.strip(),
            temperature=0
        )
    
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        return ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=groq_key,
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
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7
    )

PROVIDERS = {
    "groq":   get_groq,
    "openai": get_openai,
}

FALLBACK_CHAIN = ["groq", "openai"]