from dotenv import load_dotenv
load_dotenv()

from backend.eval.graph import build_eval_graph

graph = build_eval_graph()

print("=== GUARDIAN — DAY 3 EVAL ENGINE ===\n")

# Test 1 — good output
print("--- Test 1: Good Output ---")
result = graph.invoke({
    "input_text":  "What is LangGraph?",
    "output_text": "LangGraph is a framework by LangChain for building stateful multi-agent applications using graph-based workflows with nodes and conditional edges."
})
print(f"Accuracy:     {result['accuracy_score']}/5")
print(f"Logic:        {result['logic_score']}/5")
print(f"Completeness: {result['completeness_score']}/5")
print(f"Final Score:  {result['final_score']}/5")
print(f"Verdict:      {result['final_verdict']}")
print(f"Confidence:   {result['confidence']}")

print("\n--- Test 2: Bad Output ---")
result2 = graph.invoke({
    "input_text":  "What is the capital of France?",
    "output_text": "The capital of France is Berlin and it is known for the Eiffel Tower."
})
print(f"Accuracy:     {result2['accuracy_score']}/5")
print(f"Logic:        {result2['logic_score']}/5")
print(f"Completeness: {result2['completeness_score']}/5")
print(f"Final Score:  {result2['final_score']}/5")
print(f"Verdict:      {result2['final_verdict']}")
print(f"Issues:       {result2['issues']}")