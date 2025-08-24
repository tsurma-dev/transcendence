import {
	MeshBuilder,
	StandardMaterial,
	Color3,
	Scene,
	Vector3,
	AbstractMesh,
	ShadowGenerator
} from "@babylonjs/core";

import { GAME_CONFIG } from "../../shared/GameConfig";
import type { PlayerState } from "../../shared/types";

export class Paddle {
  public mesh: AbstractMesh;

  // Create a paddle.
  constructor(name: string, scene: Scene, color: Vector3, position: Vector3, shadowGenerator: ShadowGenerator) {
    this.mesh = MeshBuilder.CreateBox(name, {
      width: GAME_CONFIG.PADDLE_WIDTH,
      height: GAME_CONFIG.PADDLE_HEIGHT,
      depth: GAME_CONFIG.PADDLE_DEPTH
    }, scene);

  // Set the initial position of the paddle.
  this.mesh.position.set(position.x, position.y, position.z);

  // Create and assign a simple colored material to the paddle.
  const paddleMaterial = new StandardMaterial(name + "Mat", scene);
  paddleMaterial.diffuseColor = new Color3(color.x, color.y, color.z);
  this.mesh.material = paddleMaterial;

  // Enable shadows for the paddle.
  shadowGenerator.addShadowCaster(this.mesh);
  this.mesh.receiveShadows = true;
  }

  // Update the paddle's position based on the game state.
  public updateFromState(state: PlayerState): void {
    this.mesh.position.x = state.x;
    this.mesh.position.z = state.z;
  }
}