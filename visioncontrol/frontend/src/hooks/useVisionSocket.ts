import { useEffect, useRef, useState, useCallback } from "react";
import type { GestureEvent } from "../types/events";

export interface UseVisionSocketReturn {
  event: GestureEvent | null;
  isConnected: boolean;
  sendHoverState: (hovering: boolean) => void;
  setSimulationMode: (simulation: boolean) => void;
  toggleCamera: (enabled: boolean) => void;
  setExperience: (experience: string) => void;
  sendControllerAction: (action: string, payload?: { x?: number; y?: number; delta_y?: number; token?: string }) => void;
  armController: (token: string) => void;
  disarmController: () => void;
  sendWsMessage: (msg: Record<string, unknown>) => void;
  reconnect: () => void;
}

export function useVisionSocket(url: string = "ws://127.0.0.1:8000/ws"): UseVisionSocketReturn {
  const [event, setEvent] = useState<GestureEvent | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    try {
      if (socketRef.current) {
        socketRef.current.close();
      }

      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (msg) => {
        try {
          const data: GestureEvent = JSON.parse(msg.data);
          setEvent(data);
        } catch (e) {
          console.error("Erro ao decodificar evento gestual:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (err) => {
        console.warn("WebSocket status/error:", err);
      };
    } catch (e) {
      console.error("Falha ao inicializar WebSocket:", e);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendHoverState = useCallback((hovering: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "SET_HOVER", hovering }));
    }
  }, []);

  const setSimulationMode = useCallback((simulation: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "SET_MODE", simulation }));
    }
  }, []);

  const toggleCamera = useCallback((enabled: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "SET_CAMERA", enabled }));
    } else {
      fetch(`http://127.0.0.1:8000/api/camera/${enabled ? "start" : "stop"}`, {
        method: "POST"
      }).catch(console.error);
    }
  }, []);

  const setExperience = useCallback((experience: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "SET_EXPERIENCE", experience }));
    }
  }, []);

  const sendControllerAction = useCallback((action: string, payload: { x?: number; y?: number; delta_y?: number; token?: string } = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "CONTROLLER_ACTION", action, ...payload }));
    }
  }, []);

  const armController = useCallback((token: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "CONTROLLER_ARM", token }));
    }
  }, []);

  const disarmController = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "CONTROLLER_DISARM" }));
    }
  }, []);

  const sendWsMessage = useCallback((msg: Record<string, unknown>) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return {
    event,
    isConnected,
    sendHoverState,
    setSimulationMode,
    toggleCamera,
    setExperience,
    sendControllerAction,
    armController,
    disarmController,
    sendWsMessage,
    reconnect: connect,
  };
}
