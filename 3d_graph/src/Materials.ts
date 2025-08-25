import { Scene, StandardMaterial, Color3, Texture } from "@babylonjs/core";

export class Materials {
  private scene: Scene;
  public poolMaterial: StandardMaterial;
  public waterMaterial: StandardMaterial;

  constructor(scene: Scene) {
    this.scene = scene;

    this.poolMaterial = this._createPoolMaterial();
    this.waterMaterial = this._createWaterMaterial();
  }

	createScaledFloorMaterial(name: string, width: number, height: number, tileScale: number) {
	const floorMaterial: StandardMaterial = this.poolMaterial.clone(name);
	const uScale: number = width / tileScale;
	const vScale: number = height / tileScale;

	// Scale all textures on the cloned material
	if (floorMaterial.diffuseTexture && floorMaterial.diffuseTexture instanceof Texture) {
		floorMaterial.diffuseTexture.uScale = uScale;
		floorMaterial.diffuseTexture.vScale = vScale;
	}
	if (floorMaterial.bumpTexture && floorMaterial.bumpTexture instanceof Texture) {
		floorMaterial.bumpTexture.uScale = uScale;
		floorMaterial.bumpTexture.vScale = vScale;
	}
	if (floorMaterial.ambientTexture && floorMaterial.ambientTexture instanceof Texture) {
		floorMaterial.ambientTexture.uScale = uScale;
		floorMaterial.ambientTexture.vScale = vScale;
	}
	return floorMaterial;

	}

 	private _createPoolMaterial(): StandardMaterial {
    const poolMat = new StandardMaterial("poolMat", this.scene);

    const diffuseTex = new Texture("/textures/tiles_diff.jpg", this.scene);
    poolMat.diffuseTexture = diffuseTex;

    const normalTex = new Texture("/textures/tiles_nor.jpg", this.scene);
    poolMat.bumpTexture = normalTex;
	poolMat.invertNormalMapX = true;
	poolMat.invertNormalMapY = true;

    const aoTex = new Texture("/textures/tiles_ao.jpg", this.scene);
    poolMat.ambientTexture = aoTex;

    return poolMat;
  }

  private _createWaterMaterial(): StandardMaterial {
    const waterMaterial = new StandardMaterial("waterMaterial", this.scene);
    waterMaterial.diffuseColor = new Color3(0.6, 0.8, 1);
    waterMaterial.alpha = 0.5;

    return waterMaterial;
  }

}