import {
	MeshBuilder,
	StandardMaterial,
	Color3
} from "@babylonjs/core";

import { GAME_CONSTANTS } from "../../shared/constants";

export class Paddle {
  constructor(name, scene, color, position, shadowGenerator) {
    this.scene = scene;
	this.name = name;

	this.mesh = MeshBuilder.CreateBox(name, {
		width: GAME_CONSTANTS.PADDLE_WIDTH,
		height: GAME_CONSTANTS.PADDLE_HEIGHT,
		depth: GAME_CONSTANTS.PADDLE_DEPTH
	}, this.scene);

	this.mesh.position.set(position.x, position.y, position.z);

	const paddleMaterial = new StandardMaterial(name + "Mat", this.scene);
	paddleMaterial.diffuseColor = new Color3(color.x, color.y, color.z);
	this.mesh.material = paddleMaterial;

    shadowGenerator.addShadowCaster(this.mesh);
	this.mesh.receiveShadows = true;
  }

}