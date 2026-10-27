export type PrimitiveType = "cube" | "sphere" | "cylinder" | "cone";

export type OperationCSG = "union" | "subtract" | "intersect";

export interface SceneObjectParams {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  radialSegments?: number;
}

export interface SceneObject {
  id: string;
  name: string;
  type: PrimitiveType | "csg_composite";
  params: SceneObjectParams;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  wireframe?: boolean;
  visible: boolean;
  selected?: boolean;
  csgOperation?: OperationCSG;
  parentAId?: string;
  parentBId?: string;
}

export interface SceneModel {
  version: string;
  name: string;
  timestamp: number;
  objects: SceneObject[];
}

export interface Command {
  id: string;
  name: string;
  execute: () => void;
  undo: () => void;
}
