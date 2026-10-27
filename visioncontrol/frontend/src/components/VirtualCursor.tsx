import React from "react";
import type { CursorPosition, GestureType, InteractionState, SingleHandData } from "../types/events";

interface VirtualCursorProps {
  cursor?: CursorPosition;
  gesture: GestureType;
  state: InteractionState;
  hands?: SingleHandData[];
}

export const VirtualCursor: React.FC<VirtualCursorProps> = ({ cursor, gesture, state, hands }) => {
  // Se houver múltiplas mãos, renderiza cursores independentes para cada uma
  const activeHands = hands && hands.length > 0 ? hands : (cursor ? [{
    hand_id: "default",
    handedness: "Right",
    gesture,
    confidence: 1.0,
    cursor,
    landmarks: [],
    pinch_distance: 1.0,
    is_pinching: gesture === "PINCH",
    is_fist: gesture === "CLOSED_FIST"
  }] : []);

  if (activeHands.length === 0 || state === "IDLE" || state === "LOST_TRACKING") {
    return null;
  }

  return (
    <>
      {activeHands.map((h, i) => {
        const posX = h.cursor.x * window.innerWidth;
        const posY = h.cursor.y * window.innerHeight;

        const isPincher = h.is_pinching;
        const isFist = h.is_fist;
        const isLeft = h.handedness === "Left";

        const ringColor = isPincher
          ? "#f43f5e" // Rosa neon para Pinça / Modelagem de aresta
          : isFist
          ? "#38bdf8" // Ciano neon no arrasto
          : isLeft
          ? "#60a5fa" // Azul para mão esquerda
          : "#4ade80"; // Verde para mão direita

        const size = isPincher ? 26 : isFist ? 28 : 34;

        return (
          <div
            key={h.hand_id || i}
            style={{
              position: "fixed",
              left: `${posX}px`,
              top: `${posY}px`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 9999,
              transition: "transform 0.05s linear",
            }}
          >
            <div
              style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "50%",
                border: `2px solid ${ringColor}`,
                boxShadow: `0 0 16px ${ringColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isPincher ? "rgba(244, 63, 94, 0.3)" : isFist ? "rgba(56, 189, 248, 0.25)" : "transparent",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: ringColor,
                  boxShadow: `0 0 8px ${ringColor}`,
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                left: `${size + 4}px`,
                top: "-4px",
                background: "rgba(15, 23, 42, 0.9)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: ringColor,
                fontSize: "10px",
                fontWeight: 700,
                fontFamily: "monospace",
                padding: "2px 6px",
                borderRadius: "4px",
                whiteSpace: "nowrap",
                letterSpacing: "0.5px",
              }}
            >
              {h.handedness.toUpperCase()}: {isPincher ? "PINCH (MODEL)" : h.gesture}
            </div>
          </div>
        );
      })}
    </>
  );
};
