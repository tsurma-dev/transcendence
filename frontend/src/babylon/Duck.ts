import {
	SceneLoader,
	Vector3,
	Scene,
	AbstractMesh,
	ShadowGenerator
 } from "@babylonjs/core";

import { GAME_CONFIG } from "@shared/GameConfig";
import type { DuckState } from "@shared/types";

export class Duck {
  private mesh: AbstractMesh | null = null;
  private loadingPromise: Promise<void>;

  constructor(scene: Scene, shadowGenerator: ShadowGenerator) {
    this.loadingPromise = SceneLoader.ImportMeshAsync("", "/rubber_duck/", "scene.gltf", scene)
      .then((result) => {
        const rootMesh = result.meshes[0];
        this._setupMesh(rootMesh, shadowGenerator);
        this.mesh = rootMesh;
      });
  }

  public waitForLoad(): Promise<void> {
    return this.loadingPromise;
  }

  public getMesh(): AbstractMesh | null {
    return this.mesh;
  }

  // Updates the duck's position and rotation based on the game state.
  // This method is called every frame with the latest state from the server.
  public updatePosition(state: DuckState): void {
    // If the mesh hasn't finished loading yet, do nothing.
    if (!this.mesh) {
      return;
    }

    // Ensure we're using Euler angles, not quaternions
    if (this.mesh.rotationQuaternion !== null) {
      this.mesh.rotationQuaternion = null;
    }

    this.mesh.position.x = state.x;
    this.mesh.position.z = state.z;

    // Rotation: compute from velocity vector (vx, vz) so the model front faces movement.
    // Reason: using state.dir + Math.PI can flip the model depending on model's forward axis and reflection transforms.
    // Using the velocity vector ensures we always face the actual travel direction.
    const vx = Math.cos(state.dir);
    const vz = Math.sin(state.dir);

    // Babylon uses rotation.y == 0 to face +Z. The angle from +Z to (vx, vz) is atan2(vx, vz).
    // Using atan2(x, z) returns the yaw to rotate +Z to the velocity vector.
    const rotationY = Math.atan2(vx, vz) + Math.PI;
    this.mesh.rotation.y = rotationY;

  }

  // Scales and positions the duck model based on its bounding box.
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

    // Place the duck at the water level (small downward offset so it sits nicely)
    mesh.position = new Vector3(0, GAME_CONFIG.WATER_LEVEL - 0.15, 0);

    // Use Euler rotations
    mesh.rotationQuaternion = null;
    mesh.rotation.y = 0;

    // Add entire model as shadow caster (true -> recursive)
    shadowGenerator.addShadowCaster(mesh, true);
  }
}