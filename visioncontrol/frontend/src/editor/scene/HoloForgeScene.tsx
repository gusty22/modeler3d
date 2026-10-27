import React, { useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import type { GestureEvent } from "../../types/events";
import type { SceneObject } from "./types";
import { EditableObjectMesh } from "./EditableObjectMesh";

interface HoloForgeSceneProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (id: string, updates: Partial<SceneObject>) => void;
  event: GestureEvent | null;
  activeTool: "select" | "translate" | "scale" | "rotate" | "csg";
  meshMapRef: React.MutableRefObject<Map<string, THREE.Mesh>>;
  previewObject: SceneObject | null;
}

function SceneInteractionController({
  objects,
  selectedId,
  onSelectObject,
  onUpdateObject,
  event,
  meshMapRef,
}: HoloForgeSceneProps) {
  const { camera, raycaster } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const planeIntersect = useRef(new THREE.Vector3());

  const initialGrabOffsetRef = useRef<THREE.Vector3 | null>(null);

  useFrame(() => {
    if (!event) return;

    const hands = event.hands || [];
    const selectedObj = objects.find((o) => o.id === selectedId);

    // Mão que está segurando o objeto (com pinça ativa)
    const grabbingHand = hands.find((h) => h.is_pinching);

    // Mão secundária que fará o gesto de aumento / diminuição de tamanho
    const secondaryHand = grabbingHand
      ? hands.find((h) => h.hand_id !== grabbingHand.hand_id)
      : null;

    // 1. ESCALA BIMANUAL DELIBERADA:
    // A mão primária segura o objeto (is_pinching) e a segunda mão faz gesto:
    // - Se a segunda mão estiver com OPEN_PALM -> o objeto cresce suavemente
    // - Se a segunda mão estiver com CLOSED_FIST ou PINCH -> o objeto diminui suavemente
    if (grabbingHand && secondaryHand && selectedObj) {
      const currentScale = selectedObj.scale[0];
      const scaleSpeed = 0.015; // Taxa de crescimento/diminuição contínua e suave por frame

      if (secondaryHand.gesture === "OPEN_PALM") {
        // Segunda mão aberta com palma voltada para a câmera -> AUMENTA
        const nextScale = Math.min(5.0, currentScale + scaleSpeed);
        onUpdateObject(selectedObj.id, {
          scale: [nextScale, nextScale, nextScale],
        });
      } else if (secondaryHand.gesture === "CLOSED_FIST" || secondaryHand.is_pinching) {
        // Segunda mão fechada em punho ou pinça -> DIMINUI
        const nextScale = Math.max(0.3, currentScale - scaleSpeed);
        onUpdateObject(selectedObj.id, {
          scale: [nextScale, nextScale, nextScale],
        });
      }
    }

    // 2. SELEÇÃO E MOVIMENTAÇÃO (TRANSLAÇÃO PURA)
    // Feita pela mão que está pinçando, sem afetar a escala indesejadamente
    if (grabbingHand) {
      const ndcX = grabbingHand.cursor.x * 2 - 1;
      const ndcY = -(grabbingHand.cursor.y * 2 - 1);
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      // Se nenhum objeto estiver selecionado, seleciona o objeto sob o cursor
      if (!selectedId) {
        const meshes = Array.from(meshMapRef.current.values());
        const intersects = raycaster.intersectObjects(meshes, false);
        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          for (const [id, m] of meshMapRef.current.entries()) {
            if (m === hitMesh) {
              onSelectObject(id);
              initialGrabOffsetRef.current = hitMesh.position.clone().sub(intersects[0].point);
              break;
            }
          }
        }
      } else if (selectedObj) {
        // Move o objeto suavemente mantendo a distância relativa
        planeRef.current.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(new THREE.Vector3()).negate(),
          new THREE.Vector3(...selectedObj.position)
        );

        if (raycaster.ray.intersectPlane(planeRef.current, planeIntersect.current)) {
          const target = planeIntersect.current.clone();
          if (initialGrabOffsetRef.current) {
            target.add(initialGrabOffsetRef.current);
          }
          const currentPos = new THREE.Vector3(...selectedObj.position);
          const smoothedPos = currentPos.lerp(target, 0.4);

          onUpdateObject(selectedObj.id, {
            position: [smoothedPos.x, smoothedPos.y, smoothedPos.z],
          });
        }
      }
    } else {
      initialGrabOffsetRef.current = null;
    }
  });

  return null;
}

export const HoloForgeScene: React.FC<HoloForgeSceneProps> = (props) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <Canvas
        camera={{ position: [0, 2.5, 6], fov: 50 }}
        shadows
        style={{ background: "radial-gradient(circle at center, #091224 0%, #020617 100%)" }}
        onClick={() => props.onSelectObject(null)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10, 7]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.8} color="#38bdf8" />

        <Grid
          infiniteGrid
          cellSize={0.5}
          sectionSize={2.5}
          cellColor="#1e293b"
          sectionColor="#38bdf8"
          fadeDistance={25}
          fadeStrength={1.5}
        />
        <axesHelper args={[2]} />

        {props.objects.map((obj) => (
          <EditableObjectMesh
            key={obj.id}
            object={obj}
            isSelected={obj.id === props.selectedId}
            onSelect={props.onSelectObject}
            meshMapRef={props.meshMapRef}
          />
        ))}

        {props.previewObject && (
          <mesh
            position={props.previewObject.position}
            scale={props.previewObject.scale}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#38bdf8" wireframe opacity={0.6} transparent />
          </mesh>
        )}

        <SceneInteractionController {...props} />
      </Canvas>
    </div>
  );
};
