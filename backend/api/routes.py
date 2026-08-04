import time
import uuid
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Header
from pydantic import BaseModel
from openai import OpenAI

from backend.eval.graph import build_eval_graph
from backend.eval.improver import improve_output
from backend.gateway.health import check_all_providers
from backend.memory.supabase_memory import get_average_score, get_pass_rate
from backend.memory.token_optimizer import count_tokens_approx
from backend.api.security import check_request
from backend.alerts.monitor import check_and_alert, check_regression
from backend.alerts.slack import send_slack_alert
from backend.memory.mlops_audit import run_mlops_model_audit
from backend.proxy.logger import (
    ProxyLogEntry, log_proxy_event, get_proxy_logs,
    register_ws_client, unregister_ws_client, broadcast_log
)

router = APIRouter()
graph = build_eval_graph()


class EvalRequest(BaseModel):
    input_text: str
    output_text: str


class EvalResponse(BaseModel):
    final_verdict: str
    final_score: float
    confidence: float
    issues: list[str]
    accuracy_score: int
    relevance_score: int
    completeness_score: int
    question_type: str
    reasoning: str
    tokens_est: int = 0
    tokens_saved: int = 0


class ImproveRequest(BaseModel):
    input_text: str
    output_text: str
    issues: list[str]


class ImproveResponse(BaseModel):
    improved_output: str
    orig_tokens: int = 0
    new_tokens: int = 0
    tokens_saved: int = 0
    eval_result: EvalResponse


@router.post("/eval", response_model=EvalResponse)
def run_eval(request: EvalRequest):
    t0 = time.time()
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t0))

    # ── Security gate ── runs before any LLM call ──
    guard = check_request(request.input_text, request.output_text)
    if not guard["is_safe"]:
        log_proxy_event(ProxyLogEntry(
            id=str(uuid.uuid4()),
            timestamp=t0,
            timestamp_str=ts,
            prompt=request.input_text[:120],
            blocked=True,
            block_reason=guard["reason"],
            flagged_field=guard["flagged_field"],
            latency_ms=12.0,
            tokens_saved=0,
            sampled=False
        ))
        raise HTTPException(
            status_code=400,
            detail={
                "error":         "Request blocked by GUARDIAN security guard",
                "reason":        guard["reason"],
                "flagged_field": guard["flagged_field"]
            }
        )

    try:
        result = graph.invoke({
            "input_text":  request.input_text,
            "output_text": request.output_text
        })
        log_proxy_event(ProxyLogEntry(
            id=str(uuid.uuid4()),
            timestamp=t0,
            timestamp_str=ts,
            prompt=request.input_text[:120],
            response_preview=request.output_text[:120],
            blocked=False,
            verdict=result["final_verdict"],
            score=result["final_score"],
            latency_ms=round((time.time() - t0) * 1000, 1),
            tokens_saved=result.get("tokens_saved", 0),
            sampled=True
        ))
        return EvalResponse(
            final_verdict=result["final_verdict"],
            final_score=result["final_score"],
            confidence=result["confidence"],
            issues=result.get("issues", []),
            accuracy_score=result.get("accuracy_score", 0),
            relevance_score=result.get("relevance_score", 0),
            completeness_score=result.get("completeness_score", 0),
            question_type=result.get("question_type", "factual"),
            reasoning=result.get("reasoning", ""),
            tokens_est=result.get("tokens_est", 0),
            tokens_saved=result.get("tokens_saved", 0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/security/test")
def test_security(request: EvalRequest):
    """Dry-run the security guard without running eval. Useful for testing."""
    result = check_request(request.input_text, request.output_text)
    return {
        "is_safe":       result["is_safe"],
        "flagged_field": result["flagged_field"],
        "reason":        result["reason"]
    }


@router.get("/health")
async def health():
    providers = await check_all_providers()
    return {"status": "ok", "providers": providers}


@router.get("/stats")
def stats():
    return {
        "avg_score_pass_runs": get_average_score(limit=10),
        "pass_rate_pct":       get_pass_rate(limit=10)
    }


@router.get("/monitor")
def monitor():
    """Manually trigger the alert monitor. Also auto-runs after every production eval."""
    return check_and_alert(limit=10)


@router.get("/regression")
def regression():
    """Check if quality is regressing compared to the previous window of runs."""
    return check_regression(window=10)


@router.post("/improve", response_model=ImproveResponse)
def improve(request: ImproveRequest):
    """Rewrite a failing AI output to fix detected issues, then re-evaluate it."""
    try:
        improved = improve_output(request.input_text, request.output_text, request.issues)
        orig_tokens  = count_tokens_approx(request.output_text)
        new_tokens   = count_tokens_approx(improved)
        tokens_saved = orig_tokens - new_tokens

        result = graph.invoke({
            "input_text":  request.input_text,
            "output_text": improved
        })
        return ImproveResponse(
            improved_output=improved,
            orig_tokens=orig_tokens,
            new_tokens=new_tokens,
            tokens_saved=tokens_saved,
            eval_result=EvalResponse(
                final_verdict=result["final_verdict"],
                final_score=result["final_score"],
                confidence=result["confidence"],
                issues=result.get("issues", []),
                accuracy_score=result.get("accuracy_score", 0),
                relevance_score=result.get("relevance_score", 0),
                completeness_score=result.get("completeness_score", 0),
                question_type=result.get("question_type", "factual"),
                reasoning=result.get("reasoning", ""),
                tokens_est=result.get("tokens_est", 0),
                tokens_saved=result.get("tokens_saved", 0)
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/slack/test")
def test_slack():
    """Send a test alert to verify SLACK_WEBHOOK_URL is configured."""
    sent = send_slack_alert(
        title="Test Alert",
        message="GUARDIAN is connected. Your Slack integration is working."
    )
    return {
        "sent": sent,
        "note": "Set SLACK_WEBHOOK_URL in .env if not received"
    }


# ─────────────────────────────────────────────
# PROXY ARCHITECTURE
# ─────────────────────────────────────────────

class ProxyChatMessage(BaseModel):
    role: str   # "user" | "assistant" | "system"
    content: str

class ProxyChatRequest(BaseModel):
    messages: list[ProxyChatMessage]
    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    evaluate: bool = True   # set False to skip eval (saves tokens)

# Module-level call counter for round-robin sampling
_proxy_call_count: int = 0


@router.post("/proxy/chat")
async def proxy_chat(request: ProxyChatRequest, x_openai_api_key: Optional[str] = Header(None)):
    """
    OpenAI-compatible proxy endpoint.
    Smart-samples evaluation: 1 in 5 requests (20%), always evaluates
    short/suspicious responses and the very first call. Saves ~80% eval tokens.
    """
    global _proxy_call_count
    t0 = time.time()
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    _proxy_call_count += 1
    call_n = _proxy_call_count

    # Extract last user message for security checks
    user_messages = [m for m in request.messages if m.role == "user"]
    last_user_msg = user_messages[-1].content if user_messages else ""

    # ── Pre-check ──────────────────────────────────
    guard = check_request(last_user_msg, "")
    if not guard["is_safe"]:
        entry = ProxyLogEntry(
            id=str(uuid.uuid4()),
            timestamp=t0,
            timestamp_str=ts,
            prompt=last_user_msg[:120],
            blocked=True,
            block_reason=guard["reason"],
            flagged_field=guard["flagged_field"],
            latency_ms=round((time.time() - t0) * 1000, 1),
            tokens_saved=0,
            sampled=False
        )
        log_proxy_event(entry)
        await broadcast_log(entry)
        raise HTTPException(
            status_code=400,
            detail={
                "error":   "Blocked by GUARDIAN pre-check",
                "reason":  guard["reason"],
                "blocked": True
            }
        )

    # ── Call LLM ───────────────────────────────────
    api_key = x_openai_api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="No OpenAI API key provided. Set it in the Header modal.")

    try:
        client = OpenAI(api_key=api_key)
        completion = client.chat.completions.create(
            model=request.model,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            temperature=request.temperature,
        )
        response_text = completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM call failed: {str(e)}")

    latency = round((time.time() - t0) * 1000, 1)

    # ── Smart Sampling — Token-Efficient Evaluation ─────────────────────────────
    # Policy: evaluate 1-in-5 calls (20% sample rate) to save ~80% eval tokens.
    # Override: ALWAYS evaluate if:
    #   • Response is very short (<80 chars) — likely an error or refusal
    #   • It is the very first call (establishes baseline)
    short_response = len(response_text.strip()) < 80
    should_evaluate = request.evaluate and (
        call_n == 1            # always baseline first call
        or call_n % 5 == 0    # 1-in-5 round-robin sample
        or short_response      # suspicious short response
    )

    # ── Post-check / evaluation ────────────────────
    eval_result = None
    verdict = None
    score = None

    if should_evaluate and last_user_msg:
        try:
            result = graph.invoke({
                "input_text":  last_user_msg,
                "output_text": response_text
            })
            verdict = result["final_verdict"]
            score   = result["final_score"]
            eval_result = {
                "final_verdict":       result["final_verdict"],
                "final_score":         result["final_score"],
                "confidence":          result["confidence"],
                "accuracy_score":      result.get("accuracy_score", 0),
                "relevance_score":     result.get("relevance_score", 0),
                "completeness_score":  result.get("completeness_score", 0),
                "issues":              result.get("issues", []),
                "reasoning":           result.get("reasoning", ""),
                "question_type":       result.get("question_type", "factual"),
                "sampled":             True,
            }
        except Exception:
            pass  # eval failure never blocks the response

    # ── Log & broadcast ────────────────────────────
    tokens_saved_val = 0 if should_evaluate else count_tokens_approx(response_text or "")
    entry = ProxyLogEntry(
        id=str(uuid.uuid4()),
        timestamp=t0,
        timestamp_str=ts,
        prompt=last_user_msg[:120],
        response_preview=response_text[:120],
        blocked=False,
        verdict=verdict,
        score=score,
        latency_ms=latency,
        tokens_saved=tokens_saved_val,
        sampled=should_evaluate
    )
    log_proxy_event(entry)
    await broadcast_log(entry)

    return {
        "id":      entry.id,
        "object":  "chat.completion",
        "model":   request.model,
        "choices": [{"message": {"role": "assistant", "content": response_text}}],
        "guardian": {
            "blocked":     False,
            "evaluated":   should_evaluate,
            "eval_result": eval_result,
            "latency_ms":  latency
        }
    }


@router.get("/proxy/logs")
def proxy_logs(limit: int = 50):
    """Return recent proxy call logs (last 100 stored)."""
    return [e.model_dump() for e in get_proxy_logs(limit)]


@router.websocket("/ws/proxy-logs")
async def ws_proxy_logs(websocket: WebSocket):
    """WebSocket — push new proxy log entries in real time to connected clients."""
    await websocket.accept()
    register_ws_client(websocket)
    try:
        # Send existing logs on connect so client has history
        for entry in reversed(get_proxy_logs(20)):
            await websocket.send_json(entry.model_dump())
        # Keep alive — wait for disconnect
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        unregister_ws_client(websocket)


@router.post("/data/mlops-audit")
def mlops_audit_endpoint(payload: dict = None):
    """
    Evaluates dataset compatibility across Logistic Regression, Random Forest, 
    Extra Trees, and Naive Bayes models to detect Underfitting vs Overfitting.
    """
    records = payload.get("records", []) if payload else []
    return run_mlops_model_audit(records)

