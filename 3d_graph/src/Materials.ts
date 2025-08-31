import { Scene, StandardMaterial, Color3, Texture, PBRMaterial } from "@babylonjs/core";

export class Materials {
  private scene: Scene;
  public poolMaterial: StandardMaterial;
  public waterMaterial: StandardMaterial;
  public pavementMaterial: PBRMaterial;

  constructor(scene: Scene) {
    this.scene = scene;

    this.poolMaterial = this._createPoolMaterial();
    this.waterMaterial = this._createWaterMaterial();
    this.pavementMaterial = this._createPavementMaterial();
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

    // making the material more matte
    poolMat.specularColor = new Color3(0.1, 0.1, 0.1);

    return poolMat;
  }

  private _createWaterMaterial(): StandardMaterial {
    const waterMaterial = new StandardMaterial("waterMaterial", this.scene);
    waterMaterial.diffuseColor = new Color3(0.6, 0.8, 1);
    waterMaterial.alpha = 0.5;

    return waterMaterial;
  }

   private _createPavementMaterial(): PBRMaterial {
    const pavementMat = new PBRMaterial("pavementMat", this.scene);
  // Albedo (diffuse) texture is the base color
    pavementMat.albedoTexture = new Texture("/textures/pavement_diff.jpg", this.scene);

    // Bump (normal) texture adds surface detail
    pavementMat.bumpTexture = new Texture("/textures/pavement_nor.jpg", this.scene);
    pavementMat.invertNormalMapX = true;
    pavementMat.invertNormalMapY = true;

// --- USE THE PACKED ARM TEXTURE ---
    // Load the ARM texture into the 'metallicTexture' slot.
    pavementMat.metallicTexture = new Texture("/textures/pavement_arm.jpg", this.scene);

    // Tell the material how to read the packed data:
    // Use the RED channel for Ambient Occlusion.
    pavementMat.useAmbientOcclusionFromMetallicTextureRed = true;
    // Use the GREEN channel for Roughness.
    pavementMat.useRoughnessFromMetallicTextureGreen = true;
    // Use the BLUE channel for Metallic.
    pavementMat.useMetallnessFromMetallicTextureBlue = true;
    return pavementMat;
  }

}