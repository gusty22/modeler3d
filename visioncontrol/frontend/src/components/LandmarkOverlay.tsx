import React, { useRef, useEffect } from "react";
import type { NormalizedPoint } from "../types/events";

interface LandmarkOverlayProps {
  landmarks?: NormalizedPoint[];
  enabled: boolean;
}

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

export const LandmarkOverlay: React.FC<LandmarkOverlayProps> = ({ landmarks, enabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled || !landmarks || landmarks.length < 21) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
    ctx.lineWidth = 2;
    CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      const x1 = (1.0 - p1.x) * w;
      const y1 = p1.y * h;
      const x2 = (1.0 - p2.x) * w;
      const y2 = p2.y * h;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    landmarks.forEach((p, idx) => {
      const x = (1.0 - p.x) * w;
      const y = p.y * h;
      ctx.beginPath();
      ctx.arc(x, y, idx === 9 ? 6 : 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = idx === 9 ? "#a855f7" : "#38bdf8";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [landmarks, enabled]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        width: "200px",
        height: "150px",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid rgba(56, 189, 248, 0.3)",
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
        zIndex: 50,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "4px",
          left: "8px",
          color: "#94a3b8",
          fontSize: "10px",
          fontFamily: "monospace",
          fontWeight: 600,
        }}
      >
        LANDMARKS DEPTH
      </div>
      <canvas
        ref={canvasRef}
        width={200}
        height={150}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
};
