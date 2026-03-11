import { useEffect, useMemo, useRef, useState } from "react";

import { OFFICIAL_WS_BASE_URL } from "../config/devices";
import type { ConnectionStatus, DeviceConfig, DeviceStreamState, WsMessage } from "../types";

const MIN_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;
const MAX_HISTORY_POINTS = 36;

const backoffDelay = (attempt: number): number => {
  const base = Math.min(MAX_RETRY_MS, MIN_RETRY_MS * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
};

export const useDeviceStream = (device: DeviceConfig): DeviceStreamState => {
  const [status, setStatus] = useState<ConnectionStatus>(device.deviceId ? "connecting" : "disabled");
  const [metrics, setMetrics] = useState<DeviceStreamState["metrics"]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawPayload, setRawPayload] = useState<string | null>(null);

  const retryAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!device.deviceId) {
      setStatus("disabled");
      setMetrics([]);
      setHistory([]);
      setError(null);
      setUpdatedAt(null);
      setRawPayload(null);
      return undefined;
    }

    let manualClose = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = () => {
      clearReconnectTimer();
      setStatus("connecting");

      const wsBaseUrl = device.wsBaseUrl ?? OFFICIAL_WS_BASE_URL;
      const wsUrl = `${wsBaseUrl}/nrt/${device.deviceId}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        retryAttemptRef.current = 0;
        setError(null);
        setStatus("no-data");
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as WsMessage;
          if (parsed && typeof parsed === "object" && "proxy_error" in parsed) {
            const proxyError: string = typeof (parsed as Record<string, unknown>).proxy_error === "string"
              ? String((parsed as Record<string, unknown>).proxy_error)
              : "Falha no proxy local";
            setError(proxyError);
            setStatus("error");
            return;
          }
          const result = device.parse(parsed);
          if (!result) {
            return;
          }

          setMetrics(result.metrics);
          setUpdatedAt(result.timestamp);
          setRawPayload(result.rawPayload ?? null);

          const primary = result.primary;
          if (primary !== null && Number.isFinite(primary)) {
            setHistory((current) => [...current.slice(-(MAX_HISTORY_POINTS - 1)), primary]);
          }

          setStatus("connected");
        } catch (parseError) {
          setError(parseError instanceof Error ? parseError.message : "Erro ao processar mensagem");
          setStatus("error");
        }
      };

      socket.onerror = () => {
        setStatus("error");
        setError("Falha na comunicação WebSocket");
      };

      socket.onclose = (event) => {
        if (manualClose) {
          return;
        }

        if (event.reason) {
          setError(event.reason);
        }

        const delay = backoffDelay(retryAttemptRef.current);
        retryAttemptRef.current += 1;
        setStatus("connecting");

        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      manualClose = true;
      clearReconnectTimer();

      if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) {
        socketRef.current.close();
      }
    };
  }, [device.deviceId, device.parse, device.wsBaseUrl]);

  return useMemo(
    () => ({
      status,
      metrics,
      history,
      updatedAt,
      error,
      rawPayload
    }),
    [error, history, metrics, rawPayload, status, updatedAt]
  );
};
