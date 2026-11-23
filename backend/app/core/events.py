"""
HealthShield Real-Time Cross-Portal Event Streamer (SSE / PubSub)
Broadcasts live notifications and cross-role state mutations across Patient, Hospital, and Insurer dashboards.
"""

import asyncio
import json
import datetime
from typing import Dict, Any, AsyncGenerator

# Global set of active client listener queues
_subscribers: set[asyncio.Queue] = set()


def broadcast_event(event_type: str, data: Dict[str, Any]):
    """Broadcast an event payload to all active SSE subscribers."""
    payload = {
        "event": event_type,
        "data": data,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    encoded = f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"
    
    # Broadcast to all listeners
    for q in list(_subscribers):
        try:
            q.put_nowait(encoded)
        except Exception:
            _subscribers.discard(q)


async def subscribe_event_stream() -> AsyncGenerator[str, None]:
    """Async generator yielding Server-Sent Events to connected frontend clients."""
    queue: asyncio.Queue = asyncio.Queue()
    _subscribers.add(queue)

    # Initial handshake ping
    initial_ping = {
        "event": "CONNECTED",
        "data": {"status": "LIVE_SYNC_ACTIVE", "active_clients": len(_subscribers)},
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    yield f"event: CONNECTED\ndata: {json.dumps(initial_ping)}\n\n"

    try:
        while True:
            # Wait for next event or send heartbeat every 20 seconds
            try:
                msg = await asyncio.wait_for(queue.get(), timeout=20.0)
                yield msg
            except asyncio.TimeoutError:
                # Keepalive heartbeat
                yield f": heartbeat {datetime.datetime.now(datetime.timezone.utc).isoformat()}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        _subscribers.discard(queue)
