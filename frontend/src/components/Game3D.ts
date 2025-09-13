import { PoolScene } from '../babylon/PoolScene'

export class Game3DComponent {
  private poolScene: PoolScene | null = null
  private canvas: HTMLCanvasElement
  private playerNumber: 1 | 2

  constructor(private container: HTMLElement, playerNumber: 1 | 2 = 1) {
    this.playerNumber = playerNumber
    this.canvas = document.createElement('canvas')
    this.canvas.id = 'babylon3dCanvas'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.display = 'block'
    this.container.appendChild(this.canvas)
  }
  initialize(): void {
    if (!this.poolScene) this.poolScene = new PoolScene(this.canvas)
  }
  dispose(): void {
    this.poolScene?.dispose?.()
    this.poolScene = null
    this.canvas.remove()
  }
}