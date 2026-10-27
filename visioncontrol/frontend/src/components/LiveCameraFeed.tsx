import React, { useState } from "react";
import { Camera, Maximize2, Minimize2, Eye, EyeOff } from "lucide-react";

interface LiveCameraFeedProps {
  streamUrl?: string;
  fps: number;
  latency: number;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  streamUrl = "http://127.0.0.1:8000/video_feed",
  fps,
  latency,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          padding: "8px 14px",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(56, 189, 248, 0.4)",
          borderRadius: "8px",
          color: "#38bdf8",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          zIndex: 50,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Eye size={16} /> Abrir Câmera & Sensores
      </button>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        width: minimized ? "220px" : "360px",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(56, 189, 248, 0.4)",
        background: "rgba(15, 23, 42, 0.9)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.15)",
        zIndex: 50,
        transition: "width 0.2s ease",
      }}
    >
      {/* Barra de título futurista */}
      <div
        style={{
          padding: "8px 12px",
          background: "rgba(2, 6, 23, 0.8)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              boxShadow: "0 0 8px #22c55e",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              fontWeight: 800,
              letterSpacing: "1px",
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Camera size={13} /> SENSOR VISION FEED
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setMinimized((prev) => !prev)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button
            onClick={() => setVisible(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            <EyeOff size={13} />
          </button>
        </div>
      </div>

      {/* Janela de exibição de vídeo */}
      <div style={{ position: "relative", width: "100%", background: "#000", aspectRatio: "4/3" }}>
        <img
          src={streamUrl}
          alt="Live Camera with Hand Tracking"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            // Em caso de falha transitória, oculta imagem quebrada
            (e.target as HTMLElement).style.display = "none";
          }}
          onLoad={(e) => {
            (e.target as HTMLElement).style.display = "block";
          }}
        />

        {/* Overlay com Telemetria do sensor no canto inferior */}
        <div
          style={{
            position: "absolute",
            bottom: "6px",
            left: "8px",
            right: "8px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            fontFamily: "monospace",
            color: "rgba(255, 255, 255, 0.8)",
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
          }}
        >
          <span>SENSOR: ACTIVE</span>
          <span>{fps.toFixed(0)} FPS | {latency.toFixed(0)}ms</span>
        </div>
      </div>
    </div>
  );
};
