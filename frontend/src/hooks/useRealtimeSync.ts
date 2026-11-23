"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface SyncEvent {
  event: string;
  data: any;
  timestamp: string;
}

export type EventCallback = (event: SyncEvent) => void;

export function useRealtimeSync(onEventReceived?: EventCallback) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<SyncEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const callbackRef = useRef<EventCallback | undefined>(onEventReceived);

  useEffect(() => {
    callbackRef.current = onEventReceived;
  }, [onEventReceived]);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const es = new EventSource(`${API_BASE}/api/events/stream`);

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          const syncEvt: SyncEvent = {
            event: payload.event || "UNKNOWN",
            data: payload.data || {},
            timestamp: payload.timestamp || new Date().toISOString(),
          };
          setLastEvent(syncEvt);
          if (callbackRef.current) {
            callbackRef.current(syncEvt);
          }
        } catch (err) {
          console.warn("Error parsing SSE event data:", err);
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        // Retry connection after 3 seconds
        setTimeout(() => {
          connect();
        }, 3000);
      };

      eventSourceRef.current = es;
    } catch (err) {
      console.warn("Failed to initialize SSE EventSource:", err);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastEvent,
    reconnect: connect,
  };
}
