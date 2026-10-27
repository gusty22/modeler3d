import React from "react";
import type { GestureEvent, InteractionState } from "../types/events";
import {
  Camera,
  AlertTriangle,
  Sparkles
} from "lucide-react";

interface DashboardHUDProps {
  event: GestureEvent | null;
  isConnected: boolean;
  onToggleSimulation: (enable: boolean) => void;
}

export const DashboardHUD: React.FC<DashboardHUDProps> = ({
  event,
  isConnected,
  onToggleSimulation,
}) => {
  const isSim = event?.is_simulation ?? false;
  const state: InteractionState = event?.interaction_state ?? "IDLE";
  const fps = event?.fps ?? 0;
  const latency = event?.latency_ms ?? 0;
  const handsCount = event?.hands_count ?? 0;
  const hands = event?.hands ?? [];

  const getStateColor = (s: InteractionState) => {
    switch (s) {
      case "SCALING":
        return "#f59e0b"; // Dourado
      case "MODELING":
        return "#ec4899"; // Rosa
      case "DRAGGING":
        return "#38bdf8"; // Ciano
      case "HOVERING":
        return "#c084fc";
      case "TRACKING":
        return "#4ade80";
      case "LOST_TRACKING":
        return "#f87171";
      default:
        return "#64748b";
    }
  };

  return (
    <>
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(180deg, rgba(2, 6, 23, 0.95) 0%, rgba(2, 6, 23, 0.4) 100%)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: isConnected ? "#22c55e" : "#ef4444",
              boxShadow: `0 0 10px ${isConnected ? "#22c55e" : "#ef4444"}`,
            }}
          />
          <div>
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 800,
                fontSize: "16px",
                letterSpacing: "1.5px",
                color: "#f8fafc",
              }}
            >
              VISION<span style={{ color: "#38bdf8" }}>CONTROL</span>
            </span>
            <span
              style={{
                marginLeft: "8px",
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                fontWeight: 600,
                border: "1px solid rgba(56, 189, 248, 0.3)",
              }}
            >
              DUAL-HAND 3D MODELER
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: handsCount >= 2 ? "rgba(234, 179, 8, 0.2)" : "rgba(34, 197, 94, 0.15)",
              border: `1px solid ${handsCount >= 2 ? "#eab308" : "#22c55e"}`,
              color: handsCount >= 2 ? "#facc15" : "#4ade80",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <Sparkles size={14} /> {handsCount} MÃO(S) DETECTADA(S)
          </div>

          {isSim ? (
            <button
              onClick={() => onToggleSimulation(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "rgba(245, 158, 11, 0.2)",
                border: "1px solid rgba(245, 158, 11, 0.5)",
                color: "#fbbf24",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title="Atualmente em Simulação. Clique para LIGAR a Câmera Física"
            >
              <AlertTriangle size={14} /> MODO SIMULAÇÃO (CLIQUE P/ LIGAR WEBCAM)
            </button>
          ) : (
            <button
              onClick={() => onToggleSimulation(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid rgba(34, 197, 94, 0.5)",
                color: "#4ade80",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title="Câmera física ligada. Clique para alternar para Simulação"
            >
              <Camera size={14} /> WEBCAM LIGADA (CLIQUE P/ DESLIGAR)
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "20px", fontFamily: "monospace", fontSize: "12px", alignItems: "center" }}>
          <div>
            <span style={{ color: "#64748b" }}>FPS: </span>
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>{fps.toFixed(1)}</span>
          </div>
          <div>
            <span style={{ color: "#64748b" }}>LATENCY: </span>
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>{latency.toFixed(1)}ms</span>
          </div>
        </div>
      </header>

      <div
        style={{
          position: "absolute",
          top: "80px",
          left: "24px",
          width: "300px",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "16px",
          zIndex: 40,
          color: "#e2e8f0",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "1px", marginBottom: "12px" }}>
          ESTADO DE MODELAGEM 3D
        </div>

        <div
          style={{
            padding: "10px",
            background: "rgba(2, 6, 23, 0.6)",
            borderRadius: "8px",
            border: `1px solid ${getStateColor(state)}`,
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>MODO ATUAL:</span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 800,
              fontFamily: "monospace",
              color: getStateColor(state),
            }}
          >
            {state}
          </span>
        </div>

        {hands.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
            {hands.map((h, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: "rgba(2, 6, 23, 0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              >
                <span style={{ color: h.handedness === "Left" ? "#60a5fa" : "#4ade80" }}>
                  Mão {h.handedness === "Left" ? "Esquerda" : "Direita"}:
                </span>
                <span style={{ color: h.is_pinching ? "#ec4899" : "#f8fafc", fontWeight: 700 }}>
                  {h.is_pinching ? "PINÇA (DEFORMAR)" : h.gesture}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "1px", marginBottom: "8px" }}>
          COMO MODELAR O OBJETO:
        </div>
        <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#cbd5e1", lineHeight: "1.7" }}>
          <li><b style={{ color: "#ec4899" }}>Pinça (Dedo + Polegar):</b> Agarra uma aresta/vértice e puxa para deformar a malha!</li>
          <li><b style={{ color: "#facc15" }}>Duas mãos juntas / afastando:</b> Aumenta ou diminui o tamanho (Escala Zoom).</li>
          <li><b style={{ color: "#38bdf8" }}>Punho Fechado:</b> Agarra o objeto inteiro para transladá-lo.</li>
          <li><b style={{ color: "#4ade80" }}>Mão aberta:</b> Move o cursor sem deformar.</li>
        </ul>

        <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "16px 0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            onClick={() => onToggleSimulation(!isSim)}
            style={{
              padding: "8px 12px",
              background: isSim ? "rgba(245, 158, 11, 0.2)" : "rgba(56, 189, 248, 0.1)",
              border: `1px solid ${isSim ? "#f59e0b" : "#38bdf8"}`,
              color: isSim ? "#fbbf24" : "#38bdf8",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isSim ? "Alternar para Webcam Real" : "Alternar para Simulação"}
          </button>
        </div>
      </div>
    </>
  );
};
