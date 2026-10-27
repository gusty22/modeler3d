import * as THREE from "three";
import { SUBTRACTION, ADDITION, INTERSECTION, Evaluator, Brush } from "three-bvh-csg";
import type { OperationCSG } from "../scene/types";

export class CSGService {
  private static evaluator = new Evaluator();

  static {
    CSGService.evaluator.useGroups = false;
  }

  public static performOperation(
    meshA: THREE.Mesh,
    meshB: THREE.Mesh,
    operation: OperationCSG
  ): THREE.BufferGeometry | null {
    try {
      meshA.updateMatrixWorld(true);
      meshB.updateMatrixWorld(true);

      const brushA = new Brush(meshA.geometry.clone());
      brushA.applyMatrix4(meshA.matrixWorld);
      brushA.updateMatrixWorld(true);

      const brushB = new Brush(meshB.geometry.clone());
      brushB.applyMatrix4(meshB.matrixWorld);
      brushB.updateMatrixWorld(true);

      let resultBrush: Brush;
      if (operation === "subtract") {
        resultBrush = CSGService.evaluator.evaluate(brushA, brushB, SUBTRACTION);
      } else if (operation === "union") {
        resultBrush = CSGService.evaluator.evaluate(brushA, brushB, ADDITION);
      } else {
        resultBrush = CSGService.evaluator.evaluate(brushA, brushB, INTERSECTION);
      }

      if (resultBrush && resultBrush.geometry) {
        resultBrush.geometry.computeVertexNormals();
        return resultBrush.geometry;
      }
      return null;
    } catch (err) {
      console.error("Erro na operação CSG:", err);
      return null;
    }
  }
}
