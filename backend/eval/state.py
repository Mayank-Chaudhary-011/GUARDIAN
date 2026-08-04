from typing import TypedDict, List, Optional


class EvalState(TypedDict, total=False):
    # Input
    input_text:          str
    output_text:         str
    question_type:       str        # "factual" | "detailed" | "analytical"
    run_type:            str        # "production" | "test" | "redteam"

    # Token Optimization
    tokens_est:          int        # Estimated input+output tokens
    tokens_saved:        int        # Tokens saved by optimizer

    # Critic scores
    accuracy_score:      int
    accuracy_issues:     List[str]

    relevance_score:     int        # Replaces logic_score — is the answer on-topic?
    relevance_issues:    List[str]

    completeness_score:  int
    completeness_issues: List[str]

    # Final adjudication
    final_score:         float
    final_verdict:       str
    confidence:          float
    issues:              List[str]
    reasoning:           str        # One-sentence adjudicator explanation
