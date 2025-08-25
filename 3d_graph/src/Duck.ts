import {
	SceneLoader,
	Vector3,
	Scene,
	AbstractMesh,
	ShadowGenerator
 } from "@babylonjs/core";

import { GAME_CONFIG } from "../../shared/GameConfig";
import type { DuckState } from "../../shared/types";


export class Duck {
  public mesh: AbstractMesh | null = null;  // mesh is public so the PoolScene can add it to the scene when ready.

  // Load the duck model asynchronously in the constructor.
  constructor(scene: Scene, shadowGenerator: ShadowGenerator) {
    SceneLoader.ImportMeshAsync("", "/rubber_duck/", "scene.gltf", scene)
      .then((result) => {
        const rootMesh = result.meshes[0];
        this._setupMesh(rootMesh, shadowGenerator);
        this.mesh = rootMesh;
      })
      .catch((error) => {
        console.error("Failed to load duck model:", error);
        throw error;
      });
  }

  // Updates the duck's position and rotation based on the game state.
  // This method is called every frame with the latest state from the server.
  public updateFromState(state: DuckState): void {
    // If the mesh hasn't finished loading yet, do nothing.
    if (!this.mesh) {
      return;
    }
    this.mesh.position.x = state.x;
    this.mesh.position.z = state.z;
    this.mesh.rotation.y = state.dir;
  }

  // Scales and positions the duck model based on its bounding box.
  // This is a private helper method: part of the duck's internal setup.
  private _setupMesh(mesh: AbstractMesh, shadowGenerator: ShadowGenerator): void {
    const childMeshes = mesh.getChildMeshes();
    if (childMeshes.length === 0) {
        console.warn("Duck model has no child meshes to calculate size from.");
        return;
    }

    let min = new Vector3(Infinity, Infinity, Infinity);
    let max = new Vector3(-Infinity, -Infinity, -Infinity);

    childMeshes.forEach((child) => {
        // Ensure world matrix is computed for accurate bounding box
        child.computeWorldMatrix(true);
        const childBoundingBox = child.getBoundingInfo().boundingBox;
        min = Vector3.Minimize(min, childBoundingBox.minimumWorld);
        max = Vector3.Maximize(max, childBoundingBox.maximumWorld);
    });

    const duckSize = max.subtract(min);
    const duckDiameter = Math.max(duckSize.x, duckSize.y, duckSize.z);

    // Avoid division by zero if the model is invisible or failed to load
    if (duckDiameter === 0) {
        console.error("Calculated duck diameter is zero. Cannot scale.");
        return;
    }

    const targetDiameter = GAME_CONFIG.BALL_RADIUS * 2;
    const scale = targetDiameter / duckDiameter;

    mesh.scaling.setAll(scale);
    mesh.position = new Vector3(0, GAME_CONFIG.WATER_LEVEL - 0.15, 0);

    // Add all children to the shadow generator for correct shadows
    shadowGenerator.addShadowCaster(mesh, true);
    mesh.receiveShadows = true;
  }
}