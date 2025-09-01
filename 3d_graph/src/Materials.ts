import { Scene, StandardMaterial, Color3, Texture, PBRMaterial } from "@babylonjs/core";

export class Materials {
  private scene: Scene;
  public readonly poolMaterial: StandardMaterial;
  public readonly waterMaterial: StandardMaterial;
  public readonly pavementMaterial: PBRMaterial;
  public readonly lightBoxMaterial: StandardMaterial;
  public readonly ladderMaterial: StandardMaterial;


  constructor(scene: Scene) {
    this.scene = scene;
    this.poolMaterial = this._createPoolMaterial();
    this.waterMaterial = this._createWaterMaterial();
    this.pavementMaterial = this._createPavementMaterial();
    this.lightBoxMaterial = this._createLightBoxMaterial();
    this.ladderMaterial = this._createLadderMaterial();
  }

	createScaledFloorMaterial(name: string, width: number, height: number, tileScale: number) {
	const floorMaterial: StandardMaterial = this.poolMaterial.clone(name);
	const uScale: number = width / tileScale;
	const vScale: number = height / tileScale;
	if (floorMaterial.diffuseTexture instanceof Texture) {
		floorMaterial.diffuseTexture.uScale = uScale;
		floorMaterial.diffuseTexture.vScale = vScale;
	}
	if (floorMaterial.bumpTexture instanceof Texture) {
		floorMaterial.bumpTexture.uScale = uScale;
		floorMaterial.bumpTexture.vScale = vScale;
	}
	if (floorMaterial.ambientTexture instanceof Texture) {
		floorMaterial.ambientTexture.uScale = uScale;
		floorMaterial.ambientTexture.vScale = vScale;
	}
  floorMaterial.freeze();
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
    poolMat.specularColor = new Color3(0.1, 0.1, 0.1);  // making the material more matte
    poolMat.freeze();
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
    pavementMat.albedoTexture = new Texture("/textures/pavement_diff.jpg", this.scene);   // Albedo (diffuse) texture is the base color
    pavementMat.albedoColor = new Color3(1, 1, 1);
    pavementMat.bumpTexture = new Texture("/textures/pavement_nor.jpg", this.scene);  // Bump (normal) texture adds surface detail
    pavementMat.bumpTexture.level = 2.0; // Increase normal map intensity
    // pavementMat.invertNormalMapX = true;
    // pavementMat.invertNormalMapY = true;
    pavementMat.metallicTexture = new Texture("/textures/pavement_arm.jpg", this.scene); // Ambient Occlusion, Roughness, Metallic (ARM texture)
    pavementMat.useAmbientOcclusionFromMetallicTextureRed = true;
    pavementMat.useRoughnessFromMetallicTextureGreen = true;
    pavementMat.useMetallnessFromMetallicTextureBlue = true;
    pavementMat.metallic = 0.0; // Pavement isn't metallic
    pavementMat.roughness = 1; // Pavement is rough
    pavementMat.freeze();
    return pavementMat;
  }

  public cloneAndScalePavementMaterial(
    name: string,
    uScale: number,
    vScale: number,
    uOffset: number = 0,
    vOffset: number = 0
  ): PBRMaterial {
    const mat = this.pavementMaterial.clone(name) as PBRMaterial;
    const textures = [
      mat.albedoTexture,
      mat.bumpTexture,
      mat.metallicTexture
    ];
    textures.forEach(texture => {
      if (texture && texture instanceof Texture) {
        texture.uScale = uScale;
        texture.vScale = vScale;
        texture.uOffset = uOffset;
        texture.vOffset = vOffset;
      }
    });
    mat.freeze();
    return mat;
  }

  private _createLightBoxMaterial(): StandardMaterial {
    const material = new StandardMaterial("lightBoxMat", this.scene);
    material.emissiveColor = new Color3(1, 1, 0.7);
    material.disableLighting = true;
    return material;
  }

  private _createLadderMaterial(): StandardMaterial {
    const material = new StandardMaterial("ladderMat", this.scene);
    material.diffuseColor = new Color3(0.7, 0.7, 0.7);
    material.specularColor = new Color3(0.2, 0.2, 0.2);
    material.emissiveColor = new Color3(0, 0, 0);
    return material;
  }
}
