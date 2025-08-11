import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { Inspector } from "@babylonjs/inspector";

const TABLE_WIDTH = 4;
const TABLE_DEPTH = 8;
const DUCK_RADIUS = 0.2;
const PADDLE_WIDTH = 0.8;
const PADDLE_HEIGHT = 0.6;
const PADDLE_DEPTH = 0.1;
const WATER_LEVEL = 0.15;
const PADDLE_SPEED = 0.05;
const PADDLE_WALL_GAP = 0.07;

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas);

let duck, duckVelocity;
let paddle1, paddle2;

const keys = {};

const createScene = function () {
    const scene = new BABYLON.Scene(engine);

	// =========================
    // LIGHT
    // =========================
    const light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(-0.5, -1, 0), scene);
    const light2 = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    light.position = new BABYLON.Vector3(0, 3, 0);
    light.intensity = 0.7;
    light2.intensity = 0.5;
	// Shadow
	const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.bias = 0.001;


    // =========================
    // CAMERA
    // =========================
    const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, -10, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.setPosition(new BABYLON.Vector3(0, 10, -10));
    // Camera limits
    camera.lowerBetaLimit = Math.PI / 8;
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 20;
    camera.lowerAlphaLimit = -Math.PI;
    camera.upperAlphaLimit = 0;

	// =========================
	// SOUNDS
	// =========================
	const paddleHitSound = new BABYLON.Sound(
		"paddleHit",                 // name
		"sounds/quack.mp3",     	// file path
		scene,                       // scene
		 () => { console.log("Sound loaded!"); },
		{ volume: 0.5 }              // options
	);

    // =========================
    // LOAD MODELS
    // =========================
	Promise.all([
        BABYLON.SceneLoader.ImportMeshAsync("", "/bath/", "scene.gltf", scene),
        BABYLON.SceneLoader.ImportMeshAsync("", "/rubber_duck/", "scene.gltf", scene)
    ]).then(([bathResult, duckResult]) => {

        // BATHTUB
        const bath = bathResult.meshes[0];
        bath.position = new BABYLON.Vector3(0, -3, 0);
        bath.scaling = new BABYLON.Vector3(5.7, 5.7, 5.7);
        bath.rotationQuaternion = null;
        bath.rotation.y = Math.PI / 2;

	 	// WATER
        const waterMaterial = new BABYLON.StandardMaterial("waterMaterial", scene);
        waterMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.8, 1);
        waterMaterial.alpha = 0.5;
        const waterPlane = BABYLON.MeshBuilder.CreateGround("waterPlane", { width: TABLE_WIDTH, height: TABLE_DEPTH + 2.2 }, scene);
        waterPlane.material = waterMaterial;
        waterPlane.position.y = WATER_LEVEL;
        waterPlane.position.z = 0.1;

		// DUCK
        duck = duckResult.meshes[0];
        duck.position = new BABYLON.Vector3(0, 0, 0);
        duck.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
        duck.receiveShadows = true;
        shadowGenerator.addShadowCaster(duck); // dynamic object
        duckVelocity = new BABYLON.Vector3(0.03, 0, 0.03);
    });

	// =========================
    // CREATE PADDLES
    // =========================
    const paddleMaterial1 = new BABYLON.StandardMaterial("paddleMaterial1", scene);
    paddleMaterial1.diffuseColor = new BABYLON.Color3(0, 0, 1);
    paddle1 = BABYLON.MeshBuilder.CreateBox("paddle1", { width: PADDLE_WIDTH, height: PADDLE_HEIGHT, depth: PADDLE_DEPTH }, scene);
    paddle1.position.set(0, WATER_LEVEL, -TABLE_DEPTH / 2 - PADDLE_DEPTH);
    paddle1.material = paddleMaterial1;
    paddle1.receiveShadows = true;
    shadowGenerator.addShadowCaster(paddle1);

    const paddleMaterial2 = new BABYLON.StandardMaterial("paddleMaterial2", scene);
    paddleMaterial2.diffuseColor = new BABYLON.Color3(1, 0, 0);
    paddle2 = BABYLON.MeshBuilder.CreateBox("paddle2", { width: PADDLE_WIDTH, height: PADDLE_HEIGHT, depth: PADDLE_DEPTH }, scene);
    paddle2.position.set(0, WATER_LEVEL, TABLE_DEPTH / 2 + PADDLE_DEPTH);
    paddle2.material = paddleMaterial2;
    paddle2.receiveShadows = true;
    shadowGenerator.addShadowCaster(paddle2);

	// =========================
    // MOVEMENT LOGIC
    // =========================
    const halfWidth = TABLE_WIDTH / 2 - DUCK_RADIUS / 2;
    const halfDepth = TABLE_DEPTH / 2 - DUCK_RADIUS / 2;

    // Paddle bounce function
    const checkPaddleBounce = (paddle, isPlayerOne) => {
        if (
            duck.position.z < paddle.position.z + PADDLE_DEPTH &&
            duck.position.z > paddle.position.z - PADDLE_DEPTH &&
            duck.position.x < paddle.position.x + PADDLE_WIDTH / 2 &&
            duck.position.x > paddle.position.x - PADDLE_WIDTH / 2
        ) {
            duckVelocity.z *= -1;
			paddleHitSound.play();
            duck.position.z = paddle.position.z + (isPlayerOne ? PADDLE_DEPTH : -PADDLE_DEPTH) + (isPlayerOne ? DUCK_RADIUS : -DUCK_RADIUS);
        }
    };

    scene.registerBeforeRender(() => {
        // DUCK MOVEMENT
        if (duck && duckVelocity) {
            duck.position.addInPlace(duckVelocity);

            // Bounce off X walls
            if (duck.position.x < -halfWidth || duck.position.x > halfWidth) duckVelocity.x *= -1;
            // Z wall bounce for playe 2  (temporary)
             if (duck.position.z > halfDepth) duckVelocity.z *= -1;

            // Paddle bounces
            checkPaddleBounce(paddle1, true);
            checkPaddleBounce(paddle2, false);

            // Face movement direction
            duck.rotationQuaternion = null;
            duck.rotation.y = Math.atan2(duckVelocity.x, duckVelocity.z) + Math.PI;
        }

        // PLAYER 1 CONTROLS
        if (keys["a"] || keys["A"]) paddle1.position.x -= PADDLE_SPEED;
        if (keys["d"] || keys["D"]) paddle1.position.x += PADDLE_SPEED;
        const maxX = TABLE_WIDTH / 2 - PADDLE_WIDTH / 2 - PADDLE_WALL_GAP;
        paddle1.position.x = Math.max(-maxX, Math.min(maxX, paddle1.position.x));

        // // NEW: Follow camera for paddle1
        // camera.setTarget(paddle1.position.clone().add(new BABYLON.Vector3(0, 2.5, 0)));
        // camera.setPosition(new BABYLON.Vector3(
        //     paddle1.position.x,
        //     paddle1.position.y + 7,
        //     paddle1.position.z - 5
        // ));
    });

   	// Zoom camera to paddle 1
	// Set camera target to a point above paddle1
	const targetAbovePaddle = paddle1.position.clone();
	targetAbovePaddle.y += 2.5;
	camera.setTarget(targetAbovePaddle);
	camera.setPosition(new BABYLON.Vector3(
		paddle1.position.x,
		paddle1.position.y + 5, // height above paddle
		paddle1.position.z - 5  // distance behind paddle
	));

    // KEY CONTROLS
    const keys = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, evt => {
        keys[evt.sourceEvent.key] = true;
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, evt => {
        keys[evt.sourceEvent.key] = false;
    }));


    // =========================
    // DEV TOOLING
    // =========================
    if (process.env.NODE_ENV === "development") { // CHANGED: only show in dev
        Inspector.Show(scene, {});
		 // Light gizmo for visibility
		const utilLayer = new BABYLON.UtilityLayerRenderer(scene);
		const lightGizmo = new BABYLON.LightGizmo(utilLayer);
		lightGizmo.light = light;
    }

    return scene;
};

// =========================
// RUN
// =========================
const scene = createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());

