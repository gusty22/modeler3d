import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { SceneModel } from "../scene/types";

export function exportSceneToJSON(sceneModel: SceneModel, filename = "holoforge_scene.json") {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sceneModel, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportToSTL(threeSceneOrObject: THREE.Object3D, filename = "holoforge_model.stl", binary = true) {
  const exporter = new STLExporter();
  const exportGroup = new THREE.Group();
  threeSceneOrObject.traverse((child) => {
    if ((child as THREE.Mesh).isMesh && !(child.userData && child.userData.isHelper)) {
      const clonedMesh = (child as THREE.Mesh).clone();
      clonedMesh.applyMatrix4(child.matrixWorld);
      exportGroup.add(clonedMesh);
    }
  });

  const result = exporter.parse(exportGroup, { binary });
  let blob: Blob;
  if (binary) {
    const dv = result as DataView;
    blob = new Blob([dv.buffer as ArrayBuffer], { type: "application/octet-stream" });
  } else {
    blob = new Blob([result as string], { type: "text/plain" });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportToGLB(threeSceneOrObject: THREE.Object3D, filename = "holoforge_model.glb") {
  const exporter = new GLTFExporter();
  const exportGroup = new THREE.Group();
  threeSceneOrObject.traverse((child) => {
    if ((child as THREE.Mesh).isMesh && !(child.userData && child.userData.isHelper)) {
      const clonedMesh = (child as THREE.Mesh).clone();
      clonedMesh.applyMatrix4(child.matrixWorld);
      exportGroup.add(clonedMesh);
    }
  });

  exporter.parse(
    exportGroup,
    (gltf) => {
      const blob = new Blob([gltf as ArrayBuffer], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    (err) => {
      console.error("Falha ao exportar GLB:", err);
    },
    { binary: true }
  );
}
