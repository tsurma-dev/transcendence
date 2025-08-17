import { PostProcessRenderPipeline } from "@babylonjs/core";
import { PoolScene } from "./PoolScene.js";

// Wait until the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const game = new PoolScene(canvas);
});


// const keys = {};




// 	// =========================
// 	// SOUNDS
// 	// =========================
// 	const paddleHitSound = new BABYLON.Sound(
// 		"paddleHit",                 // name
// 		"sounds/quack.mp3",     	// file path
// 		scene,                       // scene
// 		 () => { console.log("Sound loaded!"); },
// 		{ volume: 0.5 }              // options
// 	);







// 	// // =========================
//     // // MOVEMENT LOGIC
//     // // =========================
//     // const halfWidth = GAME_CONSTANTS.TABLE_WIDTH / 2 - GAME_CONSTANTS.BALL_RADIUS / 2;
//     // const halfDepth = GAME_CONSTANTS.TABLE_DEPTH / 2 - GAME_CONSTANTS.BALL_RADIUS / 2;

//     // // Paddle bounce function
//     // const checkPaddleBounce = (paddle, isPlayerOne) => {
//     //     if (
//     //         duck.position.z < paddle.position.z + GAME_CONSTANTS.PADDLE_DEPTH &&
//     //         duck.position.z > paddle.position.z - GAME_CONSTANTS.PADDLE_DEPTH &&
//     //         duck.position.x < paddle.position.x + GAME_CONSTANTS.PADDLE_WIDTH / 2 &&
//     //         duck.position.x > paddle.position.x - GAME_CONSTANTS.PADDLE_WIDTH / 2
//     //     ) {
//     //         GAME_CONSTANTS.BALL_SPEED.z *= -1;
// 	// 		paddleHitSound.play();
//     //         duck.position.z = paddle.position.z + (isPlayerOne ? GAME_CONSTANTS.PADDLE_DEPTH : -GAME_CONSTANTS.PADDLE_DEPTH) + (isPlayerOne ? GAME_CONSTANTS.BALL_RADIUS : -GAME_CONSTANTS.BALL_RADIUS);
//     //     }
//     // };

//     // scene.registerBeforeRender(() => {
//     //     // DUCK MOVEMENT
//     //     if (duck) {
//     //         duck.position.addInPlace(GAME_CONSTANTS.BALL_SPEED);

//     //         // Bounce off X walls
//     //         if (duck.position.x < -halfWidth || duck.position.x > halfWidth) GAME_CONSTANTS.BALL_SPEED.x *= -1;
//     //         // Z wall bounce for playe 2  (temporary)
//     //          if (duck.position.z > halfDepth) GAME_CONSTANTS.BALL_SPEED.z *= -1;

//     //         // Paddle bounces
//     //         checkPaddleBounce(paddle1, true);
//     //         checkPaddleBounce(paddle2, false);

//     //         // Face movement direction
//     //         duck.rotationQuaternion = null;
//     //         duck.rotation.y = Math.atan2(GAME_CONSTANTS.BALL_SPEED.x, GAME_CONSTANTS.BALL_SPEED.z) + Math.PI;
//     //     }

//     //     // PLAYER 1 CONTROLS
//     //     if (keys["a"] || keys["A"]) paddle1.position.x -= GAME_CONSTANTS.PADDLE_SPEED;
//     //     if (keys["d"] || keys["D"]) paddle1.position.x += GAME_CONSTANTS.PADDLE_SPEED;
//     //     const maxX = GAME_CONSTANTS.TABLE_WIDTH / 2 - GAME_CONSTANTS.PADDLE_WIDTH / 2 - GAME_CONSTANTS.PADDLE_WALL_GAP;
//     //     paddle1.position.x = Math.max(-maxX, Math.min(maxX, paddle1.position.x));

//     //     // // NEW: Follow camera for paddle1
//     //     // camera.setTarget(paddle1.position.clone().add(new BABYLON.Vector3(0, 2.5, 0)));
//     //     // camera.setPosition(new BABYLON.Vector3(
//     //     //     paddle1.position.x,
//     //     //     paddle1.position.y + 7,
//     //     //     paddle1.position.z - 5
//     //     // ));
//     // });

//    	// // Zoom camera to paddle 1
// 	// // Set camera target to a point above paddle1
// 	// const targetAbovePaddle = paddle1.position.clone();
// 	// targetAbovePaddle.y += 2.5;
// 	// camera.setTarget(targetAbovePaddle);
// 	// camera.setPosition(new BABYLON.Vector3(
// 	// 	paddle1.position.x,
// 	// 	paddle1.position.y + 5, // height above paddle
// 	// 	paddle1.position.z - 5  // distance behind paddle
// 	// ));

//     // // KEY CONTROLS
//     // const keys = {};
//     // scene.actionManager = new BABYLON.ActionManager(scene);
//     // scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, evt => {
//     //     keys[evt.sourceEvent.key] = true;
//     // }));
//     // scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, evt => {
//     //     keys[evt.sourceEvent.key] = false;
//     // }));


//     // =========================
//     // DEV TOOLING
//     // =========================
//     if (process.env.NODE_ENV === "development") { // CHANGED: only show in dev
//         Inspector.Show(scene, {});
// 		 // Light gizmo for visibility
// 		const utilLayer = new BABYLON.UtilityLayerRenderer(scene);
// 		const lightGizmo = new BABYLON.LightGizmo(utilLayer);
// 		lightGizmo.light = light;
//     }

//     return scene;
// };


