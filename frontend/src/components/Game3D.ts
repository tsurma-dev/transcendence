import { PoolScene } from '../babylon/PoolScene'

export type GameMode = 'local' | 'online';

export class Game3DComponent {
  private poolScene: PoolScene | null = null
  private canvas: HTMLCanvasElement
  private gameMode: GameMode;

  constructor(private container: HTMLElement, gameMode: GameMode = 'local') {
    this.gameMode = gameMode;
    this.canvas = document.createElement('canvas')
    this.canvas.id = 'babylon3dCanvas'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.display = 'block'
    this.container.appendChild(this.canvas)
  }

  initialize(): void {
    if (!this.poolScene) {
      this.poolScene = new PoolScene(this.canvas, this.gameMode);
    }
  }

  dispose(): void {
    this.poolScene?.dispose?.()
    this.poolScene = null
    this.canvas.remove()
  }

    getGameMode(): GameMode {
    return this.gameMode;
  }
}