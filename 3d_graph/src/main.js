import { PoolScene } from "./PoolScene.js";

// Wait until the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const game = new PoolScene(canvas);
});



