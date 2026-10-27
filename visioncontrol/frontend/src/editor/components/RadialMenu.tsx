import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { CursorPosition, GestureEvent } from "../../types/events";

export interface RadialMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: "create" | "transform" | "edit" | "system";
}

interface RadialMenuProps {
  isOpen: boolean;
  onClose: () => void;
  cursor: CursorPosition | null | undefined;
  centerPos: { x: number; y: number };
  items: RadialMenuItem[];
  activeItemId: string | null;
  onSelectItem: (id: string) => void;
  event?: GestureEvent | null;
}

export const RadialMenu: React.FC<RadialMenuProps> = ({
  isOpen,
  onClose,
  cursor,
  centerPos,
  items,
  activeItemId,
  onSelectItem,
  event,
}) => {
  const radius = 130;
  const count = items.length;
  const wasPinchingRef = useRef<boolean>(false);
  const hoveredItemIdRef = useRef<string | null>(null);

  // Monitora o toque do indicador no polegar (PINCH CLICK) sobre as opções do menu
  useEffect(() => {
    if (!isOpen || !cursor) return;

    const screenCursorX = cursor.x * window.innerWidth;
    const screenCursorY = cursor.y * window.innerHeight;

    // Detecta qual item está sob o cursor
    let currentHovered: string | null = null;
    items.forEach((item, index) => {
      const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
      const itemX = centerPos.x + Math.cos(angle) * radius;
      const itemY = centerPos.y + Math.sin(angle) * radius;
      const dist = Math.hypot(screenCursorX - itemX, screenCursorY - itemY);

      if (dist < 38) {
        currentHovered = item.id;
      }
    });

    // Detecta se está sobre o centro (Fechar)
    const centerDist = Math.hypot(screenCursorX - centerPos.x, screenCursorY - centerPos.y);
    const isHoveringCenter = centerDist < 35;

    hoveredItemIdRef.current = currentHovered;

    // Detecção do Clique Gestual (Pinch Tap: indicador bate no polegar)
    const primaryHand = event?.hands?.[0];
    const isPinchingNow = primaryHand ? primaryHand.is_pinching : event?.gesture === "PINCH";

    if (isPinchingNow && !wasPinchingRef.current) {
      // Disparou o toque do indicador no polegar!
      if (currentHovered) {
        const item = items.find((i) => i.id === currentHovered);
        if (item) {
          item.action();
          onSelectItem(item.id);
        }
      } else if (isHoveringCenter) {
        onClose();
      }
    }

    wasPinchingRef.current = !!isPinchingNow;
  }, [isOpen, cursor, event, items, centerPos, count, radius, onClose, onSelectItem]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${centerPos.x}px`,
        top: `${centerPos.y}px`,
        transform: "translate(-50%, -50%)",
        width: `${radius * 2 + 100}px`,
        height: `${radius * 2 + 100}px`,
        pointerEvents: "auto",
        zIndex: 50,
        userSelect: "none",
      }}
    >
      {/* Círculo central com botão Fechar */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          border: "2px solid #38bdf8",
          boxShadow: "0 0 20px rgba(56, 189, 248, 0.4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          color: "#38bdf8",
          zIndex: 55,
        }}
        title="Fechar Menu (ou toque com pinça)"
      >
        <X size={20} />
      </div>

      {/* Anel de fundo holográfico */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="rgba(56, 189, 248, 0.25)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius + 35}
          fill="none"
          stroke="rgba(56, 189, 248, 0.15)"
          strokeWidth="1"
        />
      </svg>

      {/* Botões Radiais */}
      {items.map((item, index) => {
        const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const isActive = activeItemId === item.id;

        return (
          <div
            key={item.id}
            onClick={() => {
              item.action();
              onSelectItem(item.id);
            }}
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: "translate(-50%, -50%)",
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: isActive
                ? "rgba(56, 189, 248, 0.95)"
                : "rgba(15, 23, 42, 0.85)",
              border: isActive
                ? "2px solid #ffffff"
                : "1.5px solid rgba(56, 189, 248, 0.4)",
              boxShadow: isActive
                ? "0 0 25px rgba(56, 189, 248, 0.8)"
                : "0 4px 15px rgba(0, 0, 0, 0.5)",
              color: isActive ? "#020617" : "#e2e8f0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease-out",
              backdropFilter: "blur(6px)",
            }}
            title={`${item.label} (Bata o polegar no indicador para clicar)`}
          >
            {item.icon}
            <span
              style={{
                fontSize: "8px",
                fontWeight: 700,
                marginTop: "2px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
