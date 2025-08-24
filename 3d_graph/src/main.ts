import { PoolScene } from "./PoolScene.js";

// Declare a variable to hold the scene instance
let poolScene: PoolScene | null = null;

// Wait until the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  if (canvas instanceof HTMLCanvasElement) {
    poolScene = new PoolScene(canvas);
  } else {
    console.error("Canvas element with id 'renderCanvas' not found or is not a HTMLCanvasElement.");
  }
});

// Add a listener to clean up when the user leaves the page
window.addEventListener('beforeunload', () => {
  if (poolScene) {
    console.log("Disposing of the scene before unloading the page.");
    poolScene.dispose();
  }
});



