import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import {Inspector} from '@babylonjs/inspector';
// import { sceneVertexDeclaration } from '@babylonjs/core/Shaders/ShadersInclude/sceneVertexDeclaration';

const canvas = document.getElementById('renderCanvas');

const engine = new BABYLON.Engine(canvas);

const createScene = function () {
	const scene = new BABYLON.Scene(engine);

	// scene.createDefaultCameraOrLight(true, true, true);

	// scene.createDefaultLight();

	const light = new BABYLON.PointLight('light', new BABYLON.Vector3(2, 10, 0), scene);

	// // first shooter view
	// const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 5, -10), scene);

	const camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
	camera.attachControl(true)

	// camera.inputs.addMouseWheel();
	camera.setTarget(BABYLON.Vector3.Zero());

	camera.setPosition(new BABYLON.Vector3(0, 5, -10));

	// Limit camera movement
	camera.lowerBetaLimit = Math.PI / 4;
	camera.upperBetaLimit = Math.PI / 2.2;
	camera.lowerRadiusLimit = 10;
	camera.upperRadiusLimit = 20;

	// pinpong table
	const box = new BABYLON.MeshBuilder.CreateBox('table', {
		size: 0.1,
		width: 6,
		height: 0.2,
		depth: 10,
		faceColors: [
			new BABYLON.Color4(1, 0, 0, 1), // Red
			BABYLON.Color3.Green(), // Green
		]
	}, scene);

	const CATbox = new BABYLON.MeshBuilder.CreateBox('box', {
		size: 1.5,
		faceUV: [
			new BABYLON.Vector4(0, 0, 1, 1), // Front face
			new BABYLON.Vector4(0, 0, 1, 1), // Back face
			new BABYLON.Vector4(0, 0, 1, 1), // Left face
			new BABYLON.Vector4(0, 0, 1, 1), // Right face
			new BABYLON.Vector4(0, 0, 1, 1), // Top face
			new BABYLON.Vector4(0, 0, 1, 1) // Bottom face
		],
		wrap: true,
	}, scene);

	const boxCatMat = new BABYLON.StandardMaterial();
	CATbox.material = boxCatMat;
	boxCatMat.emissiveTexture = new BABYLON.Texture('src/cat.jpg', scene);

	const sphere = new BABYLON.MeshBuilder.CreateSphere('sphere', {
		segments: 10,
		diameter: 0.3,
	}, scene);

	sphere.position.y = 1;

	const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);

	shadowGenerator.addShadowCaster(sphere);
	box.receiveShadows = true;

	shadowGenerator.useBlurExponentialShadowMap = true;
	shadowGenerator.blurKernel = 64;

	scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
	scene.fogStart = 10;
	scene.fogEnd = 60;


	// const sphereMaterial = new BABYLON.StandardMaterial();
	// sphere.material = sphereMaterial;

	// sphereMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
	// sphereMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

	// sphereMaterial.ambientColor = new BABYLON.Color3(0, 1, 1);
	// scene.ambientColor = new BABYLON.Color3(0, 1, 0.5);

	// sphereMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);

	// sphereMaterial.alpha = 0.5; // Set transparency


	// const ground = BABYLON.MeshBuilder.CreateGround('ground', {
	// 	width: 10,
	// 	height: 10,
	// 	subdivisions: 2,
	// 	subdivisionsX: 5,
	// }, scene);

	// ground.material = new BABYLON.StandardMaterial();
	// ground.material.wireframe = true;

	// Animate the box
	// scene.registerBeforeRender(function () {
	// 	box.rotation.x += 0.01;
	// 	box.rotation.y += 0.01;
	// 	box.rotation.z += 0.01;
	// });

	// BABYLON.Animation.CreateAndStartAnimation(
	// 	'boxAnim',
	// 	box,
	// 	'rotation.y',
	// 	30,
	// 	120,
	// 	0,
	// 	Math.PI * 2,
	// 	BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
	// );

	scene.onPointerDown = function castRay() {
		const hit = scene.pick(scene.pointerX, scene.pointerY);
		if (hit.pickedMesh && hit.pickedMesh.name === 'sphere') {
			hit.pickedMesh.position.y += 0.5; // Move the sphere up on click
			hit.pickedMesh.rotation.x += Math.PI / 4; // Rotate the sphere on click
			hit.pickedMesh.rotation.y += Math.PI / 4;
			hit.pickedMesh.rotation.z += Math.PI / 4;
		}
	};

	// https://doc.babylonjs.com/features/featuresDeepDive/importers/loadingFileTypes
	// About loading glTF files

	//Background music
	const bgMusic = new BABYLON.Sound(
		'bgMusic',
		'/hummani_hei.mp3',
		scene,
		() => {
			// This runs when the sound is loaded
			window.addEventListener('pointerdown', () => {
				if (bgMusic && !bgMusic.isPlaying) {
					bgMusic.play();
				}
			});
		},
		{
			loop: true,
			autoplay: false,
			volume: 1,
		}
	);

	window.addEventListener('pointerdown', () => {
		if (!window.bgMusic) {
			window.bgMusic = new BABYLON.Sound(
				'bgMusic',
				'/hummani_hei.mp3',
				scene,
				function() { window.bgMusic.play(); },
				{ loop: true, autoplay: false, volume: 1 }
			);
		} else if (!window.bgMusic.isPlaying) {
			window.bgMusic.play();
		}
	});

	window.bgMusic = bgMusic;

	return scene;
}

window.BABYLON = BABYLON;

const scene = createScene();

engine.runRenderLoop(function () {
	scene.render();
});


window.addEventListener('resize', function () {
	engine.resize();
});

Inspector.Show(scene, {});