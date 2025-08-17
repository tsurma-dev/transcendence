import { SceneLoader, Vector3 } from "@babylonjs/core";
import { GAME_CONSTANTS } from "../../shared/constants";

export class Duck {
  constructor(scene, shadowGenerator) {
    this.scene = scene;
    this.mesh = null; // To hold the duck's 3D model
    this.velocity = new Vector3(GAME_CONSTANTS.BALL_SPEED, 0, GAME_CONSTANTS.BALL_SPEED);

    // Load the duck model
    SceneLoader.ImportMeshAsync("", "/rubber_duck/", "scene.gltf", this.scene)
      .then((result) => {
        this.mesh = result.meshes[0];

		// Calculate duck radius to match it with BALL_RADIUS
        const childMeshes = this.mesh.getChildMeshes();
        let min = new Vector3(Infinity, Infinity, Infinity);
        let max = new Vector3(-Infinity, -Infinity, -Infinity);
        childMeshes.forEach((mesh) => {
            mesh.refreshBoundingInfo(true); // true forces re-calculation
            const meshBox = mesh.getBoundingInfo().boundingBox;
            min = Vector3.Minimize(min, meshBox.minimumWorld);
            max = Vector3.Maximize(max, meshBox.maximumWorld);
        });
        // Calculate radius from the combined bounding box
        const duckRadius = Math.max(
            max.x - min.x,
            max.y - min.y,
            max.z - min.z
        ) / 2;
		// Scale duck
        const scale = GAME_CONSTANTS.BALL_RADIUS / duckRadius;
        this.mesh.scaling = new Vector3(scale, scale, scale);

        this.mesh.position = new Vector3(0, GAME_CONSTANTS.WATER_LEVEL - 0.15, 0);
        shadowGenerator.addShadowCaster(this.mesh, true);
		this.mesh.receiveShadows = true;
      });
  }
	update() {
    // This check ensures we don't try to move the duck before it has finished loading
    if (!this.mesh) {
      return;
    }

   // Make duck face the direction of movement
    this.mesh.rotationQuaternion = null;
    // this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z) + Math.PI;

	// // Get the time elapsed since the last frame (in seconds)
    // const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

    // // Scale the velocity by deltaTime to ensure consistent speed
    // const scaledVelocity = this.velocity.scale(deltaTime);
    // this.mesh.position.addInPlace(scaledVelocity);

  }
}