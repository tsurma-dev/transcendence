import {
  Scene,
  Engine,
//   FreeCamera,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  DirectionalLight,
  PointLight,
  ShadowGenerator,
  Vector4,
  SceneLoader,
  UtilityLayerRenderer,
  LightGizmo,
  Sound,
  Color3,
  HDRCubeTexture,
  CSG,
  PBRMaterial,
  Texture,
  ImageProcessingConfiguration,
  GlowLayer
} from "@babylonjs/core";

import "@babylonjs/loaders/glTF";
import { Inspector } from "@babylonjs/inspector";

import { GAME_CONFIG } from "../../shared/GameConfig"
import { Materials } from "./Materials";
import { Duck } from "./Duck";
import { Paddle } from "./Paddle";
import { GameClient } from "./GameClient";
import type { Snapshot } from "../../shared/protocol";
import type {PlayerId, GameState, CollisionEvent} from "../../shared/types";


export class PoolScene {
  // Babylon essentials
  private scene: Scene;
  private engine: Engine;
  private canvas: HTMLCanvasElement;

  // Camera and lighting
  private light!: DirectionalLight;
  private hemilight!: HemisphericLight;
  private shadowGenerator!: ShadowGenerator;
  private poolLights: PointLight[] = [];

  // Game objects
  private duck: Duck;
  private bottomPaddle: Paddle;
  private topPaddle: Paddle;
  private paddles: Map<PlayerId, Paddle> = new Map(); // Maps server ID to a paddle object
  private arePaddlesMapped = false; // Flag to ensure mapping only happens once

  // Client and State
  private client: GameClient;

  // Sounds
  private wallHitSound: Sound;
  private paddleHitSound: Sound;

  // Event handlers for cleanup
  private keyDownHandler: (e: KeyboardEvent) => void;
  private keyUpHandler: (e: KeyboardEvent) => void;
  private resizeHandler: () => void;

  // --- CONSTRUCTOR ---
  // Sets up the entire scene, connects to the server, and starts the render loop.
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    // 1. Initialize sounds
    this.wallHitSound = new Sound("wallHit", "/sounds/quack.ogg", this.scene);
    this.paddleHitSound = new Sound("paddleHit", "/sounds/quack.ogg", this.scene);

    // 2. Initialize Game Objects
    this.duck = new Duck(this.scene, this.shadowGenerator);
    this.bottomPaddle = new Paddle("bottomPaddle", this.scene, new Vector3(0, 0, 1), new Vector3(0, GAME_CONFIG.WATER_LEVEL, -GAME_CONFIG.TABLE_DEPTH / 2 - GAME_CONFIG.PADDLE_DEPTH), this.shadowGenerator);
    this.topPaddle = new Paddle("topPaddle", this.scene, new Vector3(1, 0, 0), new Vector3(0, GAME_CONFIG.WATER_LEVEL, GAME_CONFIG.TABLE_DEPTH / 2 + GAME_CONFIG.PADDLE_DEPTH), this.shadowGenerator);

    // 3. Connect to Server and Set Handlers
    this.client = new GameClient(GAME_CONFIG.SERVER_URL);
    this.client.setSnapshotHandler((snapshot: Snapshot) => {
      this.updateFromState(snapshot.state);
    });

    // 4. Setup Input Listeners
    this.keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        this.client.sendInput(e.key, true);
      }
    };
    this.keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        this.client.sendInput(e.key, false);
      }
    };
    this.resizeHandler = () => this.engine.resize();

    window.addEventListener("keydown", this.keyDownHandler);
    window.addEventListener("keyup", this.keyUpHandler);
    window.addEventListener("resize", this.resizeHandler);

    // 5. Start Render Loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }


  // --- MAIN UPDATE LOOP ---
  //  Receives state from the server and updates the scene.
  private updateFromState(state: GameState): void {

    // Map paddles on the first valid state update
    if (!this.arePaddlesMapped && Object.keys(state.players).length === 2) {
      this.mapPaddlesFromServerState(state);
    }

    // Update duck position
    this.duck.updateFromState(state.duck);

    // Update paddles positions
    for (const playerId in state.players) {
      const playerState = state.players[playerId];
      const paddle = this.paddles.get(playerId);
      if (paddle) {
        paddle.updateFromState(playerState);
      }
    };

    // Play sounds
    state.events.forEach((event: CollisionEvent) => {
      if (event.type === 'collision') {
        if (event.collisionType === 'wall') {
          this.wallHitSound.play();
        } else if (event.collisionType === 'paddle') {
          this.paddleHitSound.play();
        }
      }
    });

    // Handle UI updates (scores (?), game status)
    // Example: document.getElementById('score1').innerText = state.scores['player1']; --TODO
    if (state.status === 'finished') {
      if (state.winner === this.client.playerId) {
        console.log("Game Over: You WIN!");
        // showWinScreen(); -- TODO
      } else {
        console.log("Game Over: You Lose.");
        // showLoseScreen(); --TODO
      }
    }
  }

  // --- HELPER METHODS ---
  // Maps the two paddles to the player IDs received from the server.
  // This is done only once, on the first valid state update.
  private mapPaddlesFromServerState(state: GameState): void {
    const playerIds = Object.keys(state.players) as PlayerId[];
    const player1State = state.players[playerIds[0]];

    if (player1State.z < 0) {
      this.paddles.set(playerIds[0], this.bottomPaddle);
      this.paddles.set(playerIds[1], this.topPaddle);
    } else {
      this.paddles.set(playerIds[0], this.topPaddle);
      this.paddles.set(playerIds[1], this.bottomPaddle);
    }

    this.arePaddlesMapped = true;
    console.log("Paddles dynamically mapped to server IDs:", this.paddles);
  }


  // --- SCENE CREATION METHODS  ---

  CreateScene(): Scene {
    const scene: Scene = new Scene(this.engine);
    const materials: Materials = new Materials(scene);

    // --- ADD GLOW LAYER FOR EMISSIVE EFFECTS ---
    const glowLayer = new GlowLayer("glow", scene);
    glowLayer.intensity = 0.8;

    // --- IMAGE PROCESSING TO FIX GREY LOOK ---
    // This acts like post-processing to enhance colors and contrast.
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    scene.imageProcessingConfiguration.exposure = 1.5;


    this._createCamera(scene);
    this._createLights(scene);
    this._createPool(scene, materials);
    this._createLadders(scene);
    this._createWater(scene, materials);
    this._createSkybox(scene);

    // --- GIZMOS ---
    if (process.env.NODE_ENV === "development") {
      Inspector.Show(scene, {});

      const utilLayer = new UtilityLayerRenderer(scene);
      const lightGizmo = new LightGizmo(utilLayer);
      lightGizmo.light = this.light;

      const hemiLightGizmo = new LightGizmo(utilLayer);
      hemiLightGizmo.light = this.hemilight;
    }
    return scene;
  }

	 _createCamera(scene: Scene): void {
		// // Free camera for testing:
		// const camera = new FreeCamera("camera", new Vector3(0, 1, -5), scene);
		// camera.attachControl();
		// camera.speed = 0.25;
		const camera = new ArcRotateCamera("camera", 0, 0, -10, new Vector3(0, 0, 0), scene);
		camera.attachControl();
		camera.setTarget(new Vector3(0, 0, -1.5));
		camera.setPosition(new Vector3(0, 10, -10));
		// Camera limits
		camera.lowerBetaLimit = Math.PI / 8;
		camera.upperBetaLimit = Math.PI / 2.2;
		camera.lowerRadiusLimit = 5;
		camera.upperRadiusLimit = 20;
		camera.lowerAlphaLimit = -Math.PI;
		camera.upperAlphaLimit = 0;
		// Limit the camera zoom speed
		camera.wheelPrecision = 50;
	 }

	_createLights(scene: Scene): void {
		//Lights
		this.light = new DirectionalLight("light", new Vector3(-0.5, -1, 0), scene);
		this.hemilight = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);
		this.light.position = new Vector3(0, 3, 0);
		this.light.intensity = 0.5;
		this.hemilight.intensity = 0.2;
		// Shadow
		this.shadowGenerator = new ShadowGenerator(2048, this.light);
		this.shadowGenerator.useBlurExponentialShadowMap = true;
		this.shadowGenerator.bias = 0.002;
		this.shadowGenerator.normalBias = 0.02;
	}

  _createSkybox(scene: Scene): void {
      const skyboxTexture = new HDRCubeTexture("/textures/skybox.hdr", scene, 512);
      scene.createDefaultSkybox(skyboxTexture, true, 1000);
    }

	_createPool(scene: Scene, materials: Materials): void {
		const tileScale: number = 3.5;
		// --- FLOOR ---
		const floorWidth = GAME_CONFIG.TABLE_WIDTH + GAME_CONFIG.WALL_THICKNESS;
		const floorHeight = GAME_CONFIG.TABLE_DEPTH + 2*GAME_CONFIG.WATER_EXTRA_SPACE + GAME_CONFIG.WALL_THICKNESS;
		const floor = MeshBuilder.CreateGround("poolFloor", {
			width: floorWidth,
			height: floorHeight
		}, scene);
		floor.material = materials.createScaledFloorMaterial("floorMat", floorWidth, floorHeight, tileScale);
		floor.position.y = GAME_CONFIG.FLOOR_LEVEL;
		floor.receiveShadows = true;

		// --- FRONT/BACK WALLS ---
		const backWallWidth = GAME_CONFIG.TABLE_WIDTH + 2 * GAME_CONFIG.WALL_THICKNESS;
		const backWallHeight = GAME_CONFIG.WALL_HEIGHT;
		const backWallDepth = GAME_CONFIG.WALL_THICKNESS;

		const backWallUV: Vector4[] = new Array(6);
		backWallUV[0] = new Vector4(0, 0, backWallWidth / tileScale, backWallHeight / tileScale);
		backWallUV[1] = new Vector4(0, 0, backWallWidth / tileScale, backWallHeight / tileScale);
		backWallUV[2] = new Vector4(0, 0, backWallDepth / tileScale, backWallHeight / tileScale);
		backWallUV[3] = new Vector4(0, 0, backWallDepth / tileScale, backWallHeight / tileScale);
		backWallUV[4] = new Vector4(0, 0, backWallWidth / tileScale, backWallDepth / tileScale);
		backWallUV[5] = new Vector4(0, 0, backWallWidth / tileScale, backWallDepth / tileScale);

		const backWall = MeshBuilder.CreateBox("backWall", {
			width: backWallWidth,
			height: backWallHeight,
			depth: backWallDepth,
			faceUV: backWallUV,
			wrap: true
		}, scene);
		backWall.position.set(0, GAME_CONFIG.FLOOR_LEVEL + GAME_CONFIG.WALL_HEIGHT / 2, -(GAME_CONFIG.TABLE_DEPTH / 2) - GAME_CONFIG.WATER_EXTRA_SPACE);
		backWall.material = materials.poolMaterial;
		// backWall.receiveShadows = true;

		const frontWall = backWall.clone("frontWall");
		frontWall.position.z = GAME_CONFIG.TABLE_DEPTH / 2 + GAME_CONFIG.WATER_EXTRA_SPACE;

		// --- SIDE WALLS ---
		const leftWallDepth = GAME_CONFIG.TABLE_DEPTH + 2*GAME_CONFIG.WATER_EXTRA_SPACE - GAME_CONFIG.WALL_THICKNESS;
		const leftWallHeight = GAME_CONFIG.WALL_HEIGHT;
		const leftWallWidth = GAME_CONFIG.WALL_THICKNESS;

		const sideWallUV: Vector4[] = new Array(6);
		sideWallUV[0] = new Vector4(0, 0, leftWallWidth / tileScale, leftWallHeight / tileScale);
		sideWallUV[1] = new Vector4(0, 0, leftWallWidth / tileScale, leftWallHeight / tileScale);
		sideWallUV[2] = new Vector4(0, 0, leftWallDepth / tileScale, leftWallHeight / tileScale);
		sideWallUV[3] = new Vector4(0, 0, leftWallDepth / tileScale, leftWallHeight / tileScale);
		sideWallUV[4] = new Vector4(0, 0, leftWallWidth / tileScale, leftWallDepth / tileScale);
		sideWallUV[5] = new Vector4(0, 0, leftWallWidth / tileScale, leftWallDepth / tileScale);

		const leftWall = MeshBuilder.CreateBox("leftWall", {
			width: leftWallWidth,
			height: leftWallHeight,
			depth: leftWallDepth,
			faceUV: sideWallUV,
			wrap: true
		}, scene);
		leftWall.position.set(-(GAME_CONFIG.TABLE_WIDTH / 2 + GAME_CONFIG.WALL_THICKNESS / 2), GAME_CONFIG.FLOOR_LEVEL + leftWallHeight / 2, 0);
		leftWall.material = materials.poolMaterial;
		// leftWall.receiveShadows = true;

		const rightWall = leftWall.clone("rightWall");
		rightWall.position.x = GAME_CONFIG.TABLE_WIDTH / 2 + GAME_CONFIG.WALL_THICKNESS / 2;

    // --- POOL LIGHTS ---
    const lightBoxMaterial = new StandardMaterial("lightBoxMat", scene);
    lightBoxMaterial.emissiveColor = new Color3(1, 1, 0.7); // Make it glow
    lightBoxMaterial.disableLighting = true; // The box itself should not be affected by other lights

    const numLightsPerSide = 3;
    const lightYPosition = GAME_CONFIG.WATER_LEVEL - 1;
    const wallLength = GAME_CONFIG.TABLE_DEPTH + 2*GAME_CONFIG.WATER_EXTRA_SPACE;
    const lightSpacing = wallLength / (numLightsPerSide + 1);

    for (let i = 0; i < numLightsPerSide; i++) {
        const zPos = -wallLength / 2 + (i + 1) * lightSpacing;
        // --- Left Side Light ---
        const leftLightBoxPosition = new Vector3(-(GAME_CONFIG.TABLE_WIDTH / 2 + 0.05), lightYPosition, zPos);

        const leftLightBox = MeshBuilder.CreateBox(`leftLightBox_${i}`, {
            width: 0.2,
            height: 0.3,
            depth: 0.5
        }, scene);
        leftLightBox.material = lightBoxMaterial;
        leftLightBox.position = leftLightBoxPosition;

        const leftLightPosition = new Vector3(leftLightBoxPosition.x + 0.15, lightYPosition, zPos);
        const leftPoolLight = new PointLight(`leftPoolLight_${i}`, leftLightPosition, scene);
        leftPoolLight.diffuse = new Color3(1, 1, 0.7);
        leftPoolLight.intensity = 0.4;
        leftPoolLight.range = 5;
        this.poolLights.push(leftPoolLight);

        // --- Right Side Light ---
        const rightLightBoxPosition = new Vector3((GAME_CONFIG.TABLE_WIDTH / 2) + 0.05, lightYPosition, zPos);

        const rightLightBox = leftLightBox.clone(`rightLightBox_${i}`);
        rightLightBox.position = rightLightBoxPosition;

        // Position the actual light slightly in front of the box
        const rightLightPosition = new Vector3(rightLightBoxPosition.x - 0.15, lightYPosition, zPos);
        const rightPoolLight = new PointLight(`rightPoolLight_${i}`, rightLightPosition, scene);
        rightPoolLight.diffuse = new Color3(1, 1, 0.7);
        rightPoolLight.intensity = 0.4;
        rightPoolLight.range = 5;
        this.poolLights.push(rightPoolLight);
    }

    // // --- ADD POOL WALLS AS SHADOW CASTERS ---
    // this.shadowGenerator.addShadowCaster(backWall, true);
    // this.shadowGenerator.addShadowCaster(frontWall, true);
    // this.shadowGenerator.addShadowCaster(leftWall, true);
    // this.shadowGenerator.addShadowCaster(rightWall, true);

    // --- SURROUNDING GROUND WITH HOLE (CSG) ---

    // 1. Clone the new pavement PBR material and scale its textures.
    const groundMaterial = materials.pavementMaterial.clone("surroundingGroundMat");
    const groundTextureScale = 12; // How many times to repeat the texture

    // This helper array scales all textures present on the PBR material
    // --- FIX: Use 'metallicTexture' which contains the ARM map ---
    const texturesToScale = ['albedoTexture', 'bumpTexture', 'metallicTexture'];
    texturesToScale.forEach(texName => {
        const texture = groundMaterial[texName as keyof PBRMaterial] as Texture | null;
        if (texture) {
            texture.uScale = groundTextureScale;
            texture.vScale = groundTextureScale;
        }
    });

    // 2. Create a thin box for the ground plane. A box is needed for CSG operations.
    const groundWidth = 50;
    const groundHeight = 50;
    const ground = MeshBuilder.CreateBox("groundCSG", {width: groundWidth, height: 0.1, depth: groundHeight}, scene);
    ground.position.y = GAME_CONFIG.FLOOR_LEVEL + GAME_CONFIG.WALL_HEIGHT - 0.2;

    // 3. Create a "cutter" mesh that is the exact shape of the pool's outer walls.
    const poolCutter = MeshBuilder.CreateBox("poolCutterCSG", {
          width: GAME_CONFIG.TABLE_WIDTH + 2 * GAME_CONFIG.WALL_THICKNESS,
          height: 5, // Height just needs to be large enough to cut through the ground
          depth: GAME_CONFIG.TABLE_DEPTH + 2 * GAME_CONFIG.WATER_EXTRA_SPACE + 2 * GAME_CONFIG.WALL_THICKNESS
      }, scene);
      poolCutter.position.y = ground.position.y; // Align vertically with the ground


      // 4. Convert both temporary meshes to CSG objects.
      const groundCSG = CSG.FromMesh(ground);
      const cutterCSG = CSG.FromMesh(poolCutter);

      // 5. Subtract the cutter from the ground.
      const groundWithHoleCSG = groundCSG.subtract(cutterCSG);

      // 6. Convert the result back to a standard mesh, applying the scaled material.
      const surroundingGround = groundWithHoleCSG.toMesh("surroundingGround", groundMaterial, scene);
      surroundingGround.receiveShadows = true;

      // 7. Dispose of the original temporary meshes to free up memory.
      ground.dispose();
      poolCutter.dispose();
    }

    _createLadders(scene: Scene): void {
        SceneLoader.ImportMeshAsync(
            "",
            "/pool_ladder/",
            "scene.gltf",
            scene
        ).then((result) => {
            const ladder1Root = result.meshes[0];

            // --- CREATE A CUSTOM LADDER MATERIAL ---
            const ladderMaterial = new StandardMaterial("ladderMat", scene);
            ladderMaterial.diffuseColor = new Color3(0.7, 0.7, 0.7); // Grey color
            ladderMaterial.specularColor = new Color3(0.2, 0.2, 0.2); // Low specular
            ladderMaterial.emissiveColor = new Color3(0, 0, 0); // No emissive glow

            // Add all visible parts of the first ladder to the shadow generator
            ladder1Root.getChildMeshes().forEach(mesh => {
                this.shadowGenerator.addShadowCaster(mesh, true);
                mesh.receiveShadows = true;
                // --- OVERRIDE THE IMPORTED MATERIAL ---
                mesh.material = ladderMaterial;
            });

            // Position and rotate the entire first ladder hierarchy
            ladder1Root.scaling.scaleInPlace(1);
            ladder1Root.position = new Vector3(-(GAME_CONFIG.TABLE_WIDTH / 2 - 0.1), 0.16, GAME_CONFIG.TABLE_DEPTH / 2 + 0.5);
            ladder1Root.rotationQuaternion = null;
            ladder1Root.rotation.y = Math.PI / 2;

            // Create second ladder
            const ladder2Root = ladder1Root.instantiateHierarchy();
            if (ladder2Root) {
                // Add all visible parts of the second ladder to the shadow generator
                ladder2Root.getChildMeshes().forEach(mesh => {
                    this.shadowGenerator.addShadowCaster(mesh, true);
                    mesh.receiveShadows = true;
                    // --- APPLY THE SAME MATERIAL TO THE SECOND LADDER ---
                    mesh.material = ladderMaterial;
                });

                // Position and rotate the entire second ladder hierarchy
                ladder2Root.position = new Vector3(GAME_CONFIG.TABLE_WIDTH / 2 - 0.1, 0.16, -(GAME_CONFIG.TABLE_DEPTH / 2 + 0.5));
                ladder2Root.rotationQuaternion = null;
                ladder2Root.rotation.y = -Math.PI / 2;
            }
		});
	}

	_createWater(scene: Scene, materials: Materials): void {
		const waterPlane = MeshBuilder.CreateGround("waterPlane", { width: GAME_CONFIG.TABLE_WIDTH, height: GAME_CONFIG.TABLE_DEPTH + 2*GAME_CONFIG.WATER_EXTRA_SPACE}, scene);
		waterPlane.material = materials.waterMaterial;
		waterPlane.position.y = GAME_CONFIG.WATER_LEVEL;
	}

  // --- CLEANUP METHOD ---
  // Cleans up all resources to prevent memory leaks.
  // This should be called when the game component is unmounted.
  dispose(): void {
    // 1. Remove all window event listeners
    window.removeEventListener("keydown", this.keyDownHandler);
    window.removeEventListener("keyup", this.keyUpHandler);
    window.removeEventListener("resize", this.resizeHandler);

    // 2. Dispose of the Babylon scene and engine
    this.scene.dispose();
    this.engine.dispose();
  }
}