import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { GestureEvent } from "../types/events";

interface SceneContainerProps {
  event: GestureEvent | null;
  onHoverChange?: (isHovering: boolean) => void;
  mouseDebug: boolean;
}

const INITIAL_VERTICES: [number, number, number][] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];

function ModelableMesh({
  event,
  mouseDebug,
}: {
  event: GestureEvent | null;
  mouseDebug: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.BoxGeometry>(null);

  const [vertexOffsets, setVertexOffsets] = useState<THREE.Vector3[]>(() =>
    INITIAL_VERTICES.map((v) => new THREE.Vector3(v[0] * 0.9, v[1] * 0.9, v[2] * 0.9))
  );

  const [scale, setScale] = useState<number>(1.0);
  const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);

  const prevTwoHandDistRef = useRef<number | null>(null);
  const prevTwoHandAngleRef = useRef<number | null>(null);

  const { camera, raycaster } = useThree();
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const planeIntersect = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!geoRef.current) return;
    const posAttr = geoRef.current.attributes.position;
    if (!posAttr) return;

    for (let i = 0; i < posAttr.count; i++) {
      const origX = posAttr.getX(i);
      const origY = posAttr.getY(i);
      const origZ = posAttr.getZ(i);

      let bestCorner = 0;
      let minD = 999;
      INITIAL_VERTICES.forEach((iv, cIdx) => {
        const d = Math.hypot(origX - iv[0], origY - iv[1], origZ - iv[2]);
        if (d < minD) {
          minD = d;
          bestCorner = cIdx;
        }
      });

      const cornerPos = vertexOffsets[bestCorner];
      if (cornerPos) {
        posAttr.setXYZ(i, cornerPos.x, cornerPos.y, cornerPos.z);
      }
    }

    posAttr.needsUpdate = true;
    geoRef.current.computeVertexNormals();
  }, [vertexOffsets]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const hands = event?.hands || [];
    const handsCount = event?.hands_count || hands.length;

    // 1. MODELAGEM BIMANUAL: Escala e Rotação
    if (handsCount >= 2 && event?.two_hand_distance !== undefined && event.two_hand_distance !== null) {
      const currentDist = event.two_hand_distance;
      const currentAngle = event.two_hand_angle ?? 0;

      if (prevTwoHandDistRef.current !== null && prevTwoHandAngleRef.current !== null) {
        const distDelta = currentDist - prevTwoHandDistRef.current;
        const angleDelta = currentAngle - prevTwoHandAngleRef.current;

        const h1 = hands[0];
        const h2 = hands[1];
        if ((h1.is_pinching || h1.is_fist) && (h2.is_pinching || h2.is_fist)) {
          setScale((s) => Math.max(0.4, Math.min(3.0, s + distDelta * 2.5)));
          meshRef.current.rotation.z -= angleDelta * 1.8;
        }
      }
      prevTwoHandDistRef.current = currentDist;
      prevTwoHandAngleRef.current = currentAngle;
    } else {
      prevTwoHandDistRef.current = null;
      prevTwoHandAngleRef.current = null;
    }

    // 2. MODELAGEM POR PINÇA (Deformação de Aresta / Vértice)
    const pinchingHand = hands.find((h) => h.is_pinching);
    if (pinchingHand) {
      const ndcX = pinchingHand.cursor.x * 2 - 1;
      const ndcY = -(pinchingHand.cursor.y * 2 - 1);
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      if (raycaster.ray.intersectPlane(plane.current, planeIntersect.current)) {
        const worldTarget = planeIntersect.current.clone();
        meshRef.current.worldToLocal(worldTarget);

        if (selectedVertexIdx === null) {
          let closestIdx = 0;
          let minD = 999;
          vertexOffsets.forEach((v, idx) => {
            const d = v.distanceTo(worldTarget);
            if (d < minD) {
              minD = d;
              closestIdx = idx;
            }
          });
          if (minD < 1.8) {
            setSelectedVertexIdx(closestIdx);
          }
        } else {
          setVertexOffsets((prev) => {
            const next = [...prev];
            next[selectedVertexIdx] = next[selectedVertexIdx].clone().lerp(worldTarget, 0.35);
            return next;
          });
        }
      }
    } else {
      setSelectedVertexIdx(null);
    }

    // 3. ARRASTO GLOBAL
    const draggingHand = hands.find((h) => h.is_fist && !h.is_pinching);
    if (draggingHand && selectedVertexIdx === null) {
      const ndcX = draggingHand.cursor.x * 2 - 1;
      const ndcY = -(draggingHand.cursor.y * 2 - 1);
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      if (raycaster.ray.intersectPlane(plane.current, planeIntersect.current)) {
        meshRef.current.position.lerp(planeIntersect.current, 0.25);
      }
    } else if (handsCount === 0 && !mouseDebug) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <group scale={[scale, scale, scale]}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry ref={geoRef} args={[2, 2, 2, 2, 2, 2]} />
        <meshStandardMaterial
          color={selectedVertexIdx !== null ? "#ec4899" : scale > 1.2 ? "#38bdf8" : "#0284c7"}
          roughness={0.25}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {vertexOffsets.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <sphereGeometry args={[idx === selectedVertexIdx ? 0.14 : 0.08, 16, 16]} />
          <meshBasicMaterial
            color={idx === selectedVertexIdx ? "#f43f5e" : "#38bdf8"}
          />
        </mesh>
      ))}
    </group>
  );
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
  event,
  mouseDebug,
}) => {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 7]} intensity={1.8} color="#e0f2fe" />
        <pointLight position={[-5, -5, -5]} intensity={0.6} color="#38bdf8" />
        <gridHelper args={[20, 20, "#334155", "#1e293b"]} position={[0, -2.2, 0]} />
        <ModelableMesh
          event={event}
          mouseDebug={mouseDebug}
        />
      </Canvas>
    </div>
  );
};
