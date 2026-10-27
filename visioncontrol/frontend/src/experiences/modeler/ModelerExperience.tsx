import { useState, useCallback, useRef, useEffect } from "react";
import * as THREE from "three";
import {
  Box,
  Circle,
  Cylinder,
  Cone,
  Copy,
  Trash2,
  Scissors,
  RotateCcw,
  RotateCw as RedoIcon,
  Save,
  Download
} from "lucide-react";
import { useVision } from "../../context/VisionContext";
import { HoloForgeScene } from "../../editor/scene/HoloForgeScene";
import { RadialMenu, type RadialMenuItem } from "../../editor/components/RadialMenu";
import { ObjectsPanel } from "../../editor/components/ObjectsPanel";
import { VirtualCursor } from "../../components/VirtualCursor";
import { LiveCameraFeed } from "../../components/LiveCameraFeed";
import { DashboardHUD } from "../../components/DashboardHUD";
import type { SceneObject, PrimitiveType } from "../../editor/scene/types";
import { CommandManager } from "../../editor/commands/CommandManager";
import { CSGService } from "../../editor/csg/CSGService";
import { exportSceneToJSON, exportToSTL, exportToGLB } from "../../editor/export/exporter";

export function ModelerExperience() {
  const { filteredEvent: event, isConnected, setSimulationMode, setActiveExperience } = useVision();

  useEffect(() => {
    setActiveExperience("modeler");
  }, [setActiveExperience]);
  const [objects, setObjects] = useState<SceneObject[]>([
    {
      id: "obj-cube-1",
      name: "Cubo Base",
      type: "cube",
      params: { width: 1.2, height: 1.2, depth: 1.2 },
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#38bdf8",
      visible: true,
      selected: false,
    },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>("obj-cube-1");
  const [activeTool] = useState<"select" | "translate" | "scale" | "rotate" | "csg">("translate");
  const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);
  const [radialCenter, setRadialCenter] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [activeRadialItem, setActiveRadialItem] = useState<string | null>(null);

  const commandManagerRef = useRef<CommandManager>(new CommandManager());
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const prevOpenPalmRef = useRef(false);

  // Gesto DELIBERADO de abertura de mão para abrir Menu Radial
  useEffect(() => {
    if (!event) return;
    const hands = event.hands || [];
    const openPalmHand = hands.find((h) => h.gesture === "OPEN_PALM" && h.confidence > 0.85);

    if (openPalmHand) {
      if (!prevOpenPalmRef.current && !isRadialMenuOpen) {
        const cx = openPalmHand.cursor.x * window.innerWidth;
        const cy = openPalmHand.cursor.y * window.innerHeight;
        setRadialCenter({ x: cx, y: cy });
        setIsRadialMenuOpen(true);
      }
      prevOpenPalmRef.current = true;
    } else {
      prevOpenPalmRef.current = false;
    }
  }, [event, isRadialMenuOpen]);

  // Criação de nova Primitiva com suporte a Undo
  const handleCreatePrimitive = useCallback((type: PrimitiveType) => {
    const newId = `obj-${type}-${Date.now().toString().slice(-4)}`;
    const colors: Record<PrimitiveType, string> = {
      cube: "#38bdf8",
      sphere: "#a855f7",
      cylinder: "#22c55e",
      cone: "#f59e0b",
    };

    const newObj: SceneObject = {
      id: newId,
      name: `${type.toUpperCase()} ${newId.slice(-3)}`,
      type,
      params: { width: 1.2, height: 1.2, depth: 1.2, radius: 0.7 },
      position: [(Math.random() - 0.5) * 1.5, 0.5, (Math.random() - 0.5) * 1.5],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: colors[type] || "#38bdf8",
      visible: true,
      selected: true,
    };

    const cmd = {
      id: `create-${newId}`,
      name: `Criar ${newObj.name}`,
      execute: () => {
        setObjects((prev) => [...prev, newObj]);
        setSelectedId(newId);
      },
      undo: () => {
        setObjects((prev) => prev.filter((o) => o.id !== newId));
        setSelectedId(null);
      },
    };

    commandManagerRef.current.execute(cmd);
    setIsRadialMenuOpen(false);
  }, []);

  // Atualização de transformações (Posição, Rotação, Escala)
  const handleUpdateObject = useCallback((id: string, updates: Partial<SceneObject>) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  }, []);

  // Duplicar objeto selecionado
  const handleDuplicate = useCallback((id: string) => {
    const target = objects.find((o) => o.id === id);
    if (!target) return;

    const dupId = `obj-${target.type}-${Date.now().toString().slice(-4)}`;
    const duplicated: SceneObject = {
      ...target,
      id: dupId,
      name: `${target.name} (Cópia)`,
      position: [target.position[0] + 0.6, target.position[1] + 0.2, target.position[2] + 0.6],
    };

    const cmd = {
      id: `dup-${dupId}`,
      name: `Duplicar ${target.name}`,
      execute: () => {
        setObjects((prev) => [...prev, duplicated]);
        setSelectedId(dupId);
      },
      undo: () => {
        setObjects((prev) => prev.filter((o) => o.id !== dupId));
        setSelectedId(id);
      },
    };

    commandManagerRef.current.execute(cmd);
  }, [objects]);

  // Excluir objeto com suporte a Desfazer
  const handleDelete = useCallback((id: string) => {
    const target = objects.find((o) => o.id === id);
    if (!target) return;

    const cmd = {
      id: `del-${id}`,
      name: `Excluir ${target.name}`,
      execute: () => {
        setObjects((prev) => prev.filter((o) => o.id !== id));
        if (selectedId === id) setSelectedId(null);
      },
      undo: () => {
        setObjects((prev) => [...prev, target]);
        setSelectedId(id);
      },
    };

    commandManagerRef.current.execute(cmd);
  }, [objects, selectedId]);

  // Alternar Visibilidade
  const handleToggleVisibility = useCallback((id: string) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, visible: !o.visible } : o))
    );
  }, []);

  // Operação Booleana CSG (Subtração / Furo)
  const handleCSGOperation = useCallback((op: "subtract" | "union" = "subtract") => {
    if (objects.length < 2) {
      alert("São necessários pelo menos 2 objetos na cena para operação booleana CSG.");
      return;
    }
    const meshA = selectedId ? meshMapRef.current.get(selectedId) : null;
    const otherObj = objects.find((o) => o.id !== selectedId);
    const meshB = otherObj ? meshMapRef.current.get(otherObj.id) : null;

    if (!meshA || !meshB) {
      alert("Selecione um objeto para aplicar a operação booleana.");
      return;
    }

    const resGeom = CSGService.performOperation(meshA, meshB, op);
    if (resGeom) {
      alert(`Operação booleana (${op}) calculada com sucesso com three-bvh-csg!`);
    }
  }, [objects, selectedId]);

  // Itens do Menu Radial
  const radialItems: RadialMenuItem[] = [
    {
      id: "cube",
      label: "Cubo",
      icon: <Box size={20} />,
      action: () => handleCreatePrimitive("cube"),
      category: "create",
    },
    {
      id: "sphere",
      label: "Esfera",
      icon: <Circle size={20} />,
      action: () => handleCreatePrimitive("sphere"),
      category: "create",
    },
    {
      id: "cylinder",
      label: "Cilindro",
      icon: <Cylinder size={20} />,
      action: () => handleCreatePrimitive("cylinder"),
      category: "create",
    },
    {
      id: "cone",
      label: "Cone",
      icon: <Cone size={20} />,
      action: () => handleCreatePrimitive("cone"),
      category: "create",
    },
    {
      id: "duplicate",
      label: "Duplicar",
      icon: <Copy size={20} />,
      action: () => {
        if (selectedId) handleDuplicate(selectedId);
        setIsRadialMenuOpen(false);
      },
      category: "edit",
    },
    {
      id: "delete",
      label: "Excluir",
      icon: <Trash2 size={20} />,
      action: () => {
        if (selectedId) handleDelete(selectedId);
        setIsRadialMenuOpen(false);
      },
      category: "edit",
    },
    {
      id: "csg",
      label: "CSG Furo",
      icon: <Scissors size={20} />,
      action: () => {
        handleCSGOperation("subtract");
        setIsRadialMenuOpen(false);
      },
      category: "edit",
    },
    {
      id: "undo",
      label: "Desfazer",
      icon: <RotateCcw size={20} />,
      action: () => {
        commandManagerRef.current.undo();
        setIsRadialMenuOpen(false);
      },
      category: "system",
    },
  ];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#020617",
        position: "relative",
        userSelect: "none",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* HUD Superior com botão para ligar/desligar câmera física */}
      <DashboardHUD
        event={event}
        isConnected={isConnected}
        onToggleSimulation={setSimulationMode}
      />

      {/* Barra de Ações Rápidas (Exportação, Desfazer/Refazer, Salvar) */}
      <div
        style={{
          position: "absolute",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "10px",
          padding: "6px 12px",
          zIndex: 40,
        }}
      >
        <button
          onClick={() => handleCreatePrimitive("cube")}
          style={btnStyle}
          title="Criar Cubo"
        >
          <Box size={14} /> +Cubo
        </button>
        <button
          onClick={() => handleCreatePrimitive("sphere")}
          style={btnStyle}
          title="Criar Esfera"
        >
          <Circle size={14} /> +Esfera
        </button>
        <button
          onClick={() => handleCreatePrimitive("cylinder")}
          style={btnStyle}
          title="Criar Cilindro"
        >
          <Cylinder size={14} /> +Cilindro
        </button>
        <button
          onClick={() => handleCreatePrimitive("cone")}
          style={btnStyle}
          title="Criar Cone"
        >
          <Cone size={14} /> +Cone
        </button>

        <div style={{ width: "1px", background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />

        <button
          onClick={() => commandManagerRef.current.undo()}
          style={btnStyle}
          title="Desfazer Ação (Undo)"
        >
          <RotateCcw size={14} /> Desfazer
        </button>
        <button
          onClick={() => commandManagerRef.current.redo()}
          style={btnStyle}
          title="Refazer Ação (Redo)"
        >
          <RedoIcon size={14} /> Refazer
        </button>

        <div style={{ width: "1px", background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />

        <button
          onClick={() =>
            exportSceneToJSON({
              version: "2.0.0",
              name: "HoloForge Scene",
              timestamp: Date.now(),
              objects,
            })
          }
          style={btnStyle}
          title="Salvar Projeto JSON"
        >
          <Save size={14} /> Salvar JSON
        </button>

        <button
          onClick={() => {
            const meshes = Array.from(meshMapRef.current.values());
            if (meshes.length > 0) {
              const group = new THREE.Group();
              meshes.forEach((m) => group.add(m.clone()));
              exportToSTL(group, "holoforge_model.stl");
            }
          }}
          style={btnStyle}
          title="Exportar Malha em STL (para Impressão 3D)"
        >
          <Download size={14} /> Exportar STL
        </button>

        <button
          onClick={() => {
            const meshes = Array.from(meshMapRef.current.values());
            if (meshes.length > 0) {
              const group = new THREE.Group();
              meshes.forEach((m) => group.add(m.clone()));
              exportToGLB(group, "holoforge_model.glb");
            }
          }}
          style={btnStyle}
          title="Exportar Cena em GLB"
        >
          <Download size={14} /> Exportar GLB
        </button>
      </div>

      {/* Editor Central 3D HoloForge */}
      <HoloForgeScene
        objects={objects}
        selectedId={selectedId}
        onSelectObject={setSelectedId}
        onUpdateObject={handleUpdateObject}
        event={event}
        activeTool={activeTool}
        meshMapRef={meshMapRef}
        previewObject={null}
      />

      {/* Painel de Objetos (Hierarquia) */}
      <ObjectsPanel
        objects={objects}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onToggleVisibility={handleToggleVisibility}
      />

      {/* Menu Radial Acionado por Gesto Deliberado */}
      <RadialMenu
        isOpen={isRadialMenuOpen}
        onClose={() => setIsRadialMenuOpen(false)}
        cursor={event?.cursor}
        centerPos={radialCenter}
        items={radialItems}
        activeItemId={activeRadialItem}
        onSelectItem={setActiveRadialItem}
        event={event}
      />

      {/* Cursor Virtual */}
      <VirtualCursor
        cursor={event?.cursor}
        gesture={event?.gesture ?? "NO_HAND"}
        state={event?.interaction_state ?? "IDLE"}
        hands={event?.hands}
      />

      {/* Câmera Feed PIP */}
      <LiveCameraFeed
        streamUrl="http://127.0.0.1:8000/video_feed"
        fps={event?.fps ?? 0}
        latency={event?.latency_ms ?? 0}
      />
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(2, 6, 23, 0.6)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "6px",
  color: "#e2e8f0",
  fontSize: "11px",
  fontWeight: 600,
  padding: "6px 10px",
  display: "flex",
  alignItems: "center",
  gap: "5px",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

export default ModelerExperience;
