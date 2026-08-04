from dotenv import load_dotenv
load_dotenv()

from backend.gateway.router import route_request, get_provider_status

print("=== GUARDIAN — DAY 2 GATEWAY TEST ===\n")

# Test 1 — normal request
print("--- Test 1: Normal Request ---")
result = route_request("What is LangGraph? Answer in one sentence.")
print(f"Provider : {result['provider']}")
print(f"Success  : {result['success']}")
print(f"Response : {result['response']}")

print("\n--- Provider Status ---")
status = get_provider_status()
for provider, info in status.items():
    print(f"{provider}: {info['status']}")