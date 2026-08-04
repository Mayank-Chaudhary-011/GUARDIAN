import os
import json
import urllib.request


def send_slack_alert(title: str, message: str) -> bool:
    """
    Send a formatted block-kit alert to Slack via incoming webhook.
    Returns True on success. Silent no-op if SLACK_WEBHOOK_URL is not set.
    """
    webhook_url = os.getenv("SLACK_WEBHOOK_URL", "")
    if not webhook_url:
        return False

    payload = {
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"GUARDIAN \u2014 {title}"}
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": message}
            },
            {
                "type": "context",
                "elements": [{"type": "plain_text", "text": "GUARDIAN AI Quality Monitor"}]
            }
        ]
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            webhook_url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception as exc:
        print(f"[SLACK] Failed to send alert: {exc}")
        return False
