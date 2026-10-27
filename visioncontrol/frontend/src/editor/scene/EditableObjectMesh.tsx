import React from "react";
import * as THREE from "three";
import type { SceneObject } from "./types";

interface EditableObjectMeshProps {
  object: SceneObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  meshMapRef: React.MutableRefObject<Map<string, THREE.Mesh>>;
}

export const EditableObjectMesh: React.FC<EditableObjectMeshProps> = ({
  object,
  isSelected,
  onSelect,
  meshMapRef,
}) => {
  const meshRef = React.useRef<THREE.Mesh>(null);

  React.useEffect(() => {
    if (meshRef.current) {
      meshMapRef.current.set(object.id, meshRef.current);
    }
    return () => {
      meshMapRef.current.delete(object.id);
    };
  }, [object.id, meshMapRef]);

  const renderGeometry = () => {
    switch (object.type) {
      case "sphere":
        return <sphereGeometry args={[object.params.radius ?? 0.8, 32, 32]} />;
      case "cylinder":
        return (
          <cylinderGeometry
            args={[
              object.params.radius ?? 0.6,
              object.params.radius ?? 0.6,
              object.params.height ?? 1.4,
              32
            ]}
          />
        );
      case "cone":
        return (
          <coneGeometry
            args={[
              object.params.radius ?? 0.8,
              object.params.height ?? 1.5,
              32
            ]}
          />
        );
      case "cube":
      default:
        return (
          <boxGeometry
            args={[
              object.params.width ?? 1.2,
              object.params.height ?? 1.2,
              object.params.depth ?? 1.2
            ]}
          />
        );
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      visible={object.visible}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(object.id);
      }}
      castShadow
      receiveShadow
    >
      {renderGeometry()}
      <meshStandardMaterial
        color={isSelected ? "#38bdf8" : object.color}
        roughness={0.25}
        metalness={0.65}
        emissive={isSelected ? "#0284c7" : "#000000"}
        emissiveIntensity={isSelected ? 0.35 : 0.0}
        wireframe={object.wireframe ?? false}
      />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[meshRef.current?.geometry || new THREE.BoxGeometry(1.2, 1.2, 1.2)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
};
