import os
from dotenv import load_dotenv
from backend.memory.supabase_memory import get_pass_rate, get_average_score, get_recent_runs
from backend.alerts.slack import send_slack_alert

load_dotenv()

PASS_RATE_THRESHOLD = float(os.getenv("ALERT_PASS_RATE_THRESHOLD", 70.0))
SCORE_THRESHOLD     = float(os.getenv("ALERT_SCORE_THRESHOLD", 3.5))


def check_and_alert(limit: int = 10) -> dict:
    pass_rate = get_pass_rate(limit=limit)
    avg_score = get_average_score(limit=limit)

    alerts = []

    if pass_rate < PASS_RATE_THRESHOLD:
        alerts.append(
            f"[ALERT] Pass rate dropped to {pass_rate}% "
            f"(threshold: {PASS_RATE_THRESHOLD}%)"
        )

    if avg_score < SCORE_THRESHOLD:
        alerts.append(
            f"[ALERT] Avg PASS score dropped to {avg_score}/5 "
            f"(threshold: {SCORE_THRESHOLD}/5)"
        )

    # Regression check — catches downward trends even if absolute thresholds are still ok
    regression = check_regression()
    if regression.get("regression_detected"):
        alerts.append(
            f"[ALERT] Regression detected — pass rate dropped "
            f"{regression['drop_percent']}% "
            f"(was {regression['previous_pass_rate']}%, now {regression['current_pass_rate']}%)"
        )

    if alerts:
        print("\n" + "=" * 50)
        for alert in alerts:
            print(alert)
        print("=" * 50 + "\n")
        # Send to Slack (no-op if SLACK_WEBHOOK_URL not configured)
        summary = "\n".join(alerts)
        send_slack_alert(title="Quality Alert", message=summary)
    else:
        print(f"[MONITOR] All clear. Pass rate: {pass_rate}% | Avg score: {avg_score}/5")


    return {
        "pass_rate":  pass_rate,
        "avg_score":  avg_score,
        "alerts":     alerts,
        "healthy":    len(alerts) == 0,
        "regression": regression
    }


def check_regression(window: int = 10) -> dict:
    """
    Compares current window against previous window.
    Detects if quality is trending downward even if still above threshold.
    """
    threshold_pct = float(os.getenv("REGRESSION_THRESHOLD_PERCENT", 3.0))

    # Current window
    current_runs  = get_recent_runs(limit=window, run_type="production")
    # Previous window (skip current, get the one before)
    previous_runs = get_recent_runs(limit=window * 2, run_type="production")
    previous_runs = previous_runs[window:]   # older half only

    if not current_runs or not previous_runs:
        return {"regression_detected": False, "reason": "Not enough data"}

    current_pass  = sum(1 for r in current_runs  if r.get("final_verdict") == "PASS") / len(current_runs)  * 100
    previous_pass = sum(1 for r in previous_runs if r.get("final_verdict") == "PASS") / len(previous_runs) * 100

    drop = round(previous_pass - current_pass, 2)

    if drop >= threshold_pct:
        print(f"[REGRESSION] ⚠️ Pass rate dropped {drop}% — was {previous_pass}%, now {current_pass}%")
        return {
            "regression_detected": True,
            "previous_pass_rate":  previous_pass,
            "current_pass_rate":   current_pass,
            "drop_percent":        drop,
            "threshold":           threshold_pct
        }

    print(f"[REGRESSION] Stable. Pass rate: {current_pass}% (prev: {previous_pass}%)")
    return {
        "regression_detected": False,
        "previous_pass_rate":  previous_pass,
        "current_pass_rate":   current_pass,
        "drop_percent":        drop
    }
