import { Scene, StandardMaterial, Color3, Texture, PBRMaterial } from "@babylonjs/core";

export class Materials {
  private scene: Scene;
  public readonly poolMaterial: PBRMaterial;
  public readonly waterMaterial: PBRMaterial;
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
	// Use StandardMaterial which works reliably with shadows
	const floorMaterial = new StandardMaterial(name, this.scene);
	
	// Apply the tile texture
	floorMaterial.diffuseTexture = new Texture("/textures/tiles_diff.jpg", this.scene);
	const uScale: number = width / tileScale;
	const vScale: number = height / tileScale;
	
	if (floorMaterial.diffuseTexture instanceof Texture) {
		floorMaterial.diffuseTexture.uScale = uScale;
		floorMaterial.diffuseTexture.vScale = vScale;
	}
	
	// Standard material settings optimized for shadows
	floorMaterial.diffuseColor = new Color3(1, 1, 1);
	floorMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular for matte look
	floorMaterial.ambientColor = new Color3(0.3, 0.3, 0.3); // Some ambient for better shadow contrast
	
	// Don't freeze to allow shadow reception to work properly
	return floorMaterial;
	}

  private _createPoolMaterial(): PBRMaterial {
    const poolMat = new PBRMaterial("poolMat", this.scene);
    poolMat.albedoTexture = new Texture("/textures/tiles_diff.jpg", this.scene);
    poolMat.albedoColor = new Color3(1, 1, 1);
    poolMat.bumpTexture = new Texture("/textures/tiles_nor.jpg", this.scene);
    poolMat.bumpTexture.level = 1;
    poolMat.ambientTexture = new Texture("/textures/tiles_ao.jpg", this.scene); // Your AO texture
    poolMat.metallic = 0.0; 
    poolMat.roughness = 0.9;
    poolMat.reflectionTexture = this.scene.environmentTexture; // reflects the skybox
    poolMat.freeze();
    return poolMat;
  }

  private _createWaterMaterial(): PBRMaterial {
    const waterMaterial = new PBRMaterial("waterMaterial", this.scene);
    waterMaterial.albedoColor = new Color3(0.1, 0.7, 0.8); // Turquoise base color
    waterMaterial.metallic = 0.0;
    waterMaterial.roughness = 0.05; // Low roughness for sharp reflections
    waterMaterial.alpha = 0.5; // transparency
    waterMaterial.reflectionTexture = this.scene.environmentTexture;
    waterMaterial.reflectivityColor = new Color3(0.1, 0.6, 0.7); // Turquoise reflection tint
    return waterMaterial;
  }

  private _createPavementMaterial(): PBRMaterial {
    const pavementMat = new PBRMaterial("pavementMat", this.scene);
    pavementMat.albedoTexture = new Texture("/textures/pavement_diff.jpg", this.scene);   // Albedo (diffuse) texture is the base color
    pavementMat.albedoColor = new Color3(1, 1, 1);
    pavementMat.bumpTexture = new Texture("/textures/pavement_nor.jpg", this.scene);  // Bump (normal) texture adds surface detail
    pavementMat.bumpTexture.level = 2.
    // pavementMat.invertNormalMapX = true;
    // pavementMat.invertNormalMapY = true;
    pavementMat.metallicTexture = new Texture("/textures/pavement_arm.jpg", this.scene); // Ambient Occlusion, Roughness, Metallic (ARM texture)
    pavementMat.useAmbientOcclusionFromMetallicTextureRed = true;
    pavementMat.useRoughnessFromMetallicTextureGreen = true;
    pavementMat.useMetallnessFromMetallicTextureBlue = true;
    pavementMat.metallic = 0.0;
    pavementMat.roughness = 0.9;
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
