def count_tokens_approx(text: str) -> int:
    # Approximate: 1 token ≈ 4 characters
    return len(text) // 4


def truncate_to_token_limit(text: str, max_tokens: int = 500) -> tuple:
    max_chars    = max_tokens * 4
    original     = count_tokens_approx(text)

    if len(text) <= max_chars:
        return text, 0

    truncated    = text[:max_chars] + "...[truncated]"
    saved        = original - count_tokens_approx(truncated)

    print(f"[TOKEN-OPT] Truncated input: {original} -> {count_tokens_approx(truncated)} tokens (saved {saved})")
    return truncated, saved


def optimize_eval_inputs(input_text: str, output_text: str) -> tuple:
    optimized_input,  saved_input  = truncate_to_token_limit(input_text,  max_tokens=300)
    optimized_output, saved_output = truncate_to_token_limit(output_text, max_tokens=600)
    total_saved = saved_input + saved_output
    return optimized_input, optimized_output, total_saved