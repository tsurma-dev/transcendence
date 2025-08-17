import {
  Scene,
  Engine,
  FreeCamera,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  DirectionalLight,
  ShadowGenerator,
  Vector4,
  SceneLoader,
  UtilityLayerRenderer,
  LightGizmo
} from "@babylonjs/core";

import "@babylonjs/loaders/glTF";
import { Inspector } from "@babylonjs/inspector";

import { GAME_CONSTANTS } from "../../shared/constants.js"
import { Materials } from "./Materials.js";
import { Duck } from "./Duck.js";
import { Paddle } from "./Paddle.js";

export class PoolScene {
  constructor(canvas) {
	this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

	// Initialize the duck and paddles
	this.duck = new Duck(this.scene, this.shadowGenerator);
	const p1_position = new Vector3(0, GAME_CONSTANTS.WATER_LEVEL, -GAME_CONSTANTS.TABLE_DEPTH / 2 - GAME_CONSTANTS.PADDLE_DEPTH);
	const p2_position = new Vector3(0, GAME_CONSTANTS.WATER_LEVEL, GAME_CONSTANTS.TABLE_DEPTH / 2 + GAME_CONSTANTS.PADDLE_DEPTH);
	this.player1 = new Paddle("player1", this.scene, new Vector3(0, 0, 1), p1_position, this.shadowGenerator);
	this.player2 = new Paddle("player2", this.scene, new Vector3(1, 0, 0), p2_position, this.shadowGenerator);

	// WebSocket stuff should come here;
	// - new positions received from backend
	// - update paddles' positions
	// - update duck's position
	// - send input events (key presses) to the backend.

	window.addEventListener("resize", () => this.engine.resize());

    this.engine.runRenderLoop(() => {
	  this.duck.update();
      this.scene.render();
    });
  }

  CreateScene(){
    const scene = new Scene(this.engine);
	const materials = new Materials(scene);

    this._createCamera(scene);
    this._createLights(scene);
    this._createPool(scene, materials);
    this._createLadders(scene);
    this._createWater(scene, materials);

	if (process.env.NODE_ENV === "development") {
		Inspector.Show(scene, {});

		const utilLayer = new UtilityLayerRenderer(scene);
		const lightGizmo = new LightGizmo(utilLayer);
		lightGizmo.light = this.light;
	}


    return scene;
  }

	 _createCamera(scene) {
		// // Free camera for testing:
		// const camera = new FreeCamera("camera", new Vector3(0, 1, -5), scene);
		// camera.attachControl();
		// camera.speed = 0.25;
		const camera = new ArcRotateCamera("camera", 0, 0, -10, new Vector3(0, 0, 0), scene);
		camera.attachControl();
		camera.setTarget(Vector3.Zero());
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


	_createLights(scene) {
		//Lights
		this.light = new DirectionalLight("light", new Vector3(-0.5, -1, 0), scene);
		const light2 = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);
		this.light.position = new Vector3(0, 3, 0);
		this.light.intensity = 0.7;
		light2.intensity = 0.4;
		// Shadow
		this.shadowGenerator = new ShadowGenerator(1024, this.light);
		this.shadowGenerator.useBlurExponentialShadowMap = true;
		this.shadowGenerator.bias = 0.001;
	}


	_createPool(scene, materials) {
		const tileScale = 3.5;
		// --- FLOOR ---
		const floorWidth = GAME_CONSTANTS.TABLE_WIDTH + GAME_CONSTANTS.WALL_THICKNESS;
		const floorHeight = GAME_CONSTANTS.TABLE_DEPTH + 2*GAME_CONSTANTS.WATER_EXTRA_SPACE + GAME_CONSTANTS.WALL_THICKNESS;
		const floor = MeshBuilder.CreateGround("poolFloor", {
			width: floorWidth,
			height: floorHeight
		}, scene);
		floor.material = materials.createScaledFloorMaterial("floorMat", floorWidth, floorHeight, tileScale);
		floor.position.y = GAME_CONSTANTS.FLOOR_LEVEL;
		floor.receiveShadows = true;

		// --- FRONT/BACK WALLS ---
		const backWallWidth = GAME_CONSTANTS.TABLE_WIDTH + GAME_CONSTANTS.WALL_THICKNESS;
		const backWallHeight = GAME_CONSTANTS.WALL_HEIGHT;
		const backWallDepth = GAME_CONSTANTS.WALL_THICKNESS;

		const backWallUV = new Array(6);
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
		backWall.position.set(0, GAME_CONSTANTS.FLOOR_LEVEL + GAME_CONSTANTS.WALL_HEIGHT / 2, -(GAME_CONSTANTS.TABLE_DEPTH / 2) - GAME_CONSTANTS.WATER_EXTRA_SPACE);
		backWall.material = materials.poolMaterial;
		backWall.receiveShadows = true;

		const frontWall = backWall.clone("frontWall");
		frontWall.position.z = GAME_CONSTANTS.TABLE_DEPTH / 2 + GAME_CONSTANTS.WATER_EXTRA_SPACE;

		// --- SIDE WALLS ---
		const leftWallDepth = GAME_CONSTANTS.TABLE_DEPTH + 2*GAME_CONSTANTS.WATER_EXTRA_SPACE - GAME_CONSTANTS.WALL_THICKNESS;
		const leftWallHeight = GAME_CONSTANTS.WALL_HEIGHT;
		const leftWallWidth = GAME_CONSTANTS.WALL_THICKNESS;

		const sideWallUV = new Array(6);
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
		leftWall.position.set(-(GAME_CONSTANTS.TABLE_WIDTH / 2), GAME_CONSTANTS.FLOOR_LEVEL + leftWallHeight / 2, 0);
		leftWall.material = materials.poolMaterial;
		leftWall.receiveShadows = true;

		const rightWall = leftWall.clone("rightWall");
		rightWall.position.x = GAME_CONSTANTS.TABLE_WIDTH / 2;
	}

	_createLadders(scene) {
		SceneLoader.ImportMeshAsync(
			"",
			"/pool_ladder/",
			"scene.gltf", // "Pool ladder" (https://skfb.ly/oR8xJ) by Conception3D is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
			scene
		).then((result) => {
			const ladder1 = result.meshes[0];
			this.shadowGenerator.addShadowCaster(ladder1, true);
			ladder1.scaling.scaleInPlace(1);
			ladder1.position = new Vector3(-1.8, 0.16, 4.5);
			ladder1.rotationQuaternion = null;
			ladder1.rotation.y = Math.PI / 2;


			const ladder2 = ladder1.instantiateHierarchy();
			this.shadowGenerator.addShadowCaster(ladder2, true);
			ladder2.position = new Vector3(1.8, 0.16, -4.5);
			ladder2.rotationQuaternion = null;
			ladder2.rotation.y = -Math.PI / 2;
		});
	}

	_createWater(scene, materials) {
		const waterPlane = MeshBuilder.CreateGround("waterPlane", { width: GAME_CONSTANTS.TABLE_WIDTH, height: GAME_CONSTANTS.TABLE_DEPTH + 2*GAME_CONSTANTS.WATER_EXTRA_SPACE}, scene);
		waterPlane.material = materials.waterMaterial;
		waterPlane.position.y = GAME_CONSTANTS.WATER_LEVEL;
	}
}