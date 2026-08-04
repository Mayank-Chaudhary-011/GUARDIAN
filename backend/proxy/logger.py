import time
import uuid
from collections import deque
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class ProxyLogEntry(BaseModel):
    id: str
    timestamp: float
    timestamp_str: str
    prompt: str
    response_preview: Optional[str] = None
    blocked: bool
    block_reason: Optional[str] = None
    flagged_field: Optional[str] = None
    verdict: Optional[str] = None
    score: Optional[float] = None
    latency_ms: float
    tokens_saved: Optional[int] = 0
    sampled: Optional[bool] = False


# In-memory ring buffer — last 100 proxy calls
_proxy_logs: deque = deque(maxlen=100)

# WebSocket clients subscribed to live feed
_ws_clients: List = []


def log_proxy_event(entry: ProxyLogEntry):
    _proxy_logs.appendleft(entry)


def get_proxy_logs(limit: int = 50) -> List[ProxyLogEntry]:
    return list(_proxy_logs)[:limit]


def register_ws_client(ws):
    _ws_clients.append(ws)


def unregister_ws_client(ws):
    if ws in _ws_clients:
        _ws_clients.remove(ws)


async def broadcast_log(entry: ProxyLogEntry):
    """Push new log entry to all connected WebSocket clients."""
    import asyncio
    dead = []
    for ws in list(_ws_clients):
        try:
            await ws.send_json(entry.model_dump())
        except Exception:
            dead.append(ws)
    for ws in dead:
        unregister_ws_client(ws)
