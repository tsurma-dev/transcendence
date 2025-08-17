import { StandardMaterial, Color3, Texture } from "@babylonjs/core";

export class Materials {
  constructor(scene) {
    this.scene = scene;

    this.poolMaterial = this._createPoolMaterial();
    this.waterMaterial = this._createWaterMaterial();
  }

	createScaledFloorMaterial(name, width, height, tileScale) {
	const floorMaterial = this.poolMaterial.clone(name);
	const uScale = width / tileScale;
	const vScale = height / tileScale;

	// Scale all textures on the cloned material
	if (floorMaterial.diffuseTexture) {
		floorMaterial.diffuseTexture.uScale = uScale;
		floorMaterial.diffuseTexture.vScale = vScale;
	}
	if (floorMaterial.bumpTexture) {
		floorMaterial.bumpTexture.uScale = uScale;
		floorMaterial.bumpTexture.vScale = vScale;
	}
	if (floorMaterial.ambientTexture) {
		floorMaterial.ambientTexture.uScale = uScale;
		floorMaterial.ambientTexture.vScale = vScale;
	}
	return floorMaterial;
	}

_createPoolMaterial() {
    const poolMat = new StandardMaterial("poolMat", this.scene);
    const texArray = [];

    const diffuseTex = new Texture("/textures/tiles_diff.jpg", this.scene);
    poolMat.diffuseTexture = diffuseTex;
    texArray.push(diffuseTex);

    const normalTex = new Texture("/textures/tiles_nor.jpg", this.scene);
    poolMat.bumpTexture = normalTex;
	poolMat.invertNormalMapX = true;
	poolMat.invertNormalMapY = true;
    texArray.push(normalTex);

    const aoTex = new Texture("/textures/tiles_ao.jpg", this.scene);
    poolMat.ambientTexture = aoTex;
    texArray.push(aoTex);

    return poolMat;
  }

  _createWaterMaterial() {
    const waterMaterial = new StandardMaterial("waterMaterial", this.scene);
    waterMaterial.diffuseColor = new Color3(0.6, 0.8, 1);
    waterMaterial.alpha = 0.5;

    return waterMaterial;
  }

}