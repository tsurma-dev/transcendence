import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import {Inspector} from '@babylonjs/inspector';
// import { sceneVertexDeclaration } from '@babylonjs/core/Shaders/ShadersInclude/sceneVertexDeclaration';

const canvas = document.getElementById('renderCanvas');

const engine = new BABYLON.Engine(canvas);

const createScene = function () {
	// Create a new scene
	const scene = new BABYLON.Scene(engine);

	// LIGHT
	// const light = new BABYLON.PointLight('light', new BABYLON.Vector3(2, 5, 0), scene);
	const light = new BABYLON.DirectionalLight('light', new BABYLON.Vector3(-0.5, -1, 0), scene);
	// const light = new BABYLON.SpotLight('light', new BABYLON.Vector3(0, 10, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 4, 2, scene);
	const light2 = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
	light.position = new BABYLON.Vector3(0, 3, 0);
	light.intensity = 0.7;
	light2.intensity = 0.5;

	// CAMERA
	const camera = new BABYLON.ArcRotateCamera('camera', 0, 0, -10, new BABYLON.Vector3(0, 0, 0), scene);
	camera.attachControl(true)
	camera.setTarget(BABYLON.Vector3.Zero());
	camera.setPosition(new BABYLON.Vector3(0, 10, -10));

	// Limit camera movement
	camera.lowerBetaLimit = Math.PI / 8; // Minimum angle from the horizontal plane
	camera.upperBetaLimit = Math.PI / 2.2; // Maximum angle from the horizontal plane
	camera.lowerRadiusLimit = 5; // Minimum distance from the target
	camera.upperRadiusLimit = 20; // Maximum distance from the target
	camera.lowerAlphaLimit = -Math.PI; // Minimum horizontal angle
	camera.upperAlphaLimit = 0; // Maximum horizontal angle (180 degrees from lower limit)

	// PINGPONG TABLE
	const box = new BABYLON.MeshBuilder.CreateBox('table', {
		size: 0.1,
		width: 4,
		height: 0.2,
		depth: 8,
	}, scene);
	// Create right and left sides of the table
	const leftSide = new BABYLON.MeshBuilder.CreateBox('leftSide', {
		size: 0.1,
		width: 0.2,
		height: 0.4,
		depth: 8,
	}, scene);
	leftSide.position.x = -2.1;
	leftSide.position.y = 0.1;
	const rightSide = new BABYLON.MeshBuilder.CreateBox('rightSide', {
		size: 0.1,
		width: 0.2,
		height: 0.4,
		depth: 8,
	}, scene);
	rightSide.position.x = 2.1;
	rightSide.position.y = 0.1;
	// Materal for the table
	const tableMaterial = new BABYLON.StandardMaterial('tableMaterial', scene);
	tableMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.4);
	box.material = tableMaterial;
	const sideMaterial = new BABYLON.StandardMaterial('sideMaterial', scene);
	sideMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
	leftSide.material = sideMaterial;
	rightSide.material = sideMaterial;


	// PINGPONG BALL
	const sphere = new BABYLON.MeshBuilder.CreateSphere('sphere', {
		segments: 80,
		diameter: 0.2,
	}, scene);
	sphere.position.y = 0.2;
	// Create a material for the ball
	const sphereMaterial = new BABYLON.StandardMaterial('sphereMaterial', scene);
	sphereMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
	sphere.material = sphereMaterial;
	// Enable shadows for the ball
	const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
	shadowGenerator.addShadowCaster(sphere);
	box.receiveShadows = true;
	shadowGenerator.useBlurExponentialShadowMap = true;

	// PINGPONG PADDLES
	const paddleMaterial = new BABYLON.StandardMaterial('paddleMaterial', scene);
	paddleMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1);
	const paddle1 = new BABYLON.MeshBuilder.CreateBox('paddle1', {
		size: 0.1,
		width: 0.8,
		height: 0.2,
		depth: 0.2,
	}, scene);
	paddle1.position.x = 0;
	paddle1.position.y = 0.2;
	paddle1.position.z = -4.1;
	paddle1.material = paddleMaterial;
	const paddle2 = new BABYLON.MeshBuilder.CreateBox('paddle2', {
		size: 0.1,
		width: 0.8,
		height: 0.2,
		depth: 0.2,
	}, scene);
	paddle2.position.x = 0;
	paddle2.position.y = 0.2;
	paddle2.position.z = 4.1;
	paddle2.material = paddleMaterial;

	// MOVING PADDLES
	// Move the paddles with arrow keys
	const keys = {};
	scene.actionManager = new BABYLON.ActionManager(scene);
	// Register key down events
	scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
		keys[evt.sourceEvent.key] = true;
	}));
	// Register key up events
	scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
		keys[evt.sourceEvent.key] = false;
	}));
	// Move paddles based on key state
	scene.registerBeforeRender(function () {
		if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
			paddle1.position.x -= 0.05;
			paddle2.position.x -= 0.05;
		}
		if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
			paddle1.position.x += 0.05;
			paddle2.position.x += 0.05;
		}
		// Keep paddles within bounds
		const maxX = 1.6; // Half the width of the table minus half the paddle width
		paddle1.position.x = Math.max(-maxX, Math.min(maxX, paddle1.position.x));
		paddle2.position.x = Math.max(-maxX, Math.min(maxX, paddle2.position.x));
	});

	// Add Gizmo for light manipulation
	const utilLayer = new BABYLON.UtilityLayerRenderer(scene);
	const lightGizmo = new BABYLON.LightGizmo(utilLayer);
	lightGizmo.light = light;

	return scene;
}

const scene = createScene();

engine.runRenderLoop(function () {
	scene.render();
});

window.addEventListener('resize', function () {
	engine.resize();
});

// Inspector.Show(scene, {});