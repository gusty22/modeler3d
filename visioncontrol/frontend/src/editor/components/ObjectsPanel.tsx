import React from "react";
import {
  Box,
  Circle,
  Cylinder,
  Cone,
  Layers,
  Trash2,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";
import type { SceneObject } from "../scene/types";

interface ObjectsPanelProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export const ObjectsPanel: React.FC<ObjectsPanelProps> = ({
  objects,
  selectedId,
  onSelect,
  onDelete,
  onDuplicate,
  onToggleVisibility,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "sphere":
        return <Circle size={14} color="#38bdf8" />;
      case "cylinder":
        return <Cylinder size={14} color="#4ade80" />;
      case "cone":
        return <Cone size={14} color="#f59e0b" />;
      case "cube":
      default:
        return <Box size={14} color="#c084fc" />;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "80px",
        right: "24px",
        width: "280px",
        maxHeight: "calc(100vh - 120px)",
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        padding: "16px",
        zIndex: 40,
        color: "#e2e8f0",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "#94a3b8",
            fontWeight: 700,
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Layers size={14} /> HIERARQUIA DA CENA ({objects.length})
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          overflowY: "auto",
          maxHeight: "360px",
        }}
      >
        {objects.length === 0 ? (
          <div
            style={{
              padding: "20px 10px",
              textAlign: "center",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            Nenhum objeto na cena. Use o Menu Radial ou os botões de criação para adicionar primitivas.
          </div>
        ) : (
          objects.map((obj) => {
            const isSelected = obj.id === selectedId;
            return (
              <div
                key={obj.id}
                onClick={() => onSelect(obj.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: isSelected
                    ? "rgba(56, 189, 248, 0.18)"
                    : "rgba(2, 6, 23, 0.4)",
                  border: isSelected
                    ? "1px solid #38bdf8"
                    : "1px solid rgba(255, 255, 255, 0.05)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getIcon(obj.type)}
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "#38bdf8" : "#f1f5f9",
                    }}
                  >
                    {obj.name}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(obj.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: obj.visible ? "#94a3b8" : "#475569",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                    title={obj.visible ? "Ocultar" : "Mostrar"}
                  >
                    {obj.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(obj.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                    title="Duplicar"
                  >
                    <Copy size={13} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(obj.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#f87171",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                    title="Excluir"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
