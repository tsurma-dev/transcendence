import { Vector3, Color3 } from "@babylonjs/core";

export const RENDERING_SETTINGS = {
  SHADOW_MAP_SIZE: 2048,
  EXPOSURE: 1.2,
  GLOW_INTENSITY: 0.8,
  GROUND_SIZE: 30,
  GROUND_TILE_SIZE: 5.9,
  TILE_SCALE: 3.5
} as const;

export const LIGHT_SETTINGS = {
  DIRECTIONAL_INTENSITY: 0.4,
  DIRECTIONAL_DIRECTION: new Vector3(-0.5, -1, 0),
  DIRECTIONAL_POSITION: new Vector3(1, 5, 2),
  HEMISPHERE_INTENSITY: 0.1,
  HEMISPHERE_DIRECTION: new Vector3(0, 1, 0), // Reflection direction
  POOL_LIGHT_INTENSITY: 0.4,
  POOL_LIGHT_RANGE: 5,
  POOL_LIGHT_DIFFUSE: new Color3(1, 1, 0.7),
  NUM_LIGHTS_PER_SIDE: 3
} as const;

export const CAMERA_SETTINGS = {
  TARGET1: new Vector3(0, 0, -1.5),
  TARGET2: new Vector3(0, 0, 1.5),
  POSITION1: new Vector3(0, 6, -8),
  POSITION2: new Vector3(0, 6, 8),
  TARGET_LOCAL: new Vector3(-0.5, 0, 0),
  POSITION_LOCAL: new Vector3(1, 8, 0),
  WHEEL_PRECISION: 50
} as const;