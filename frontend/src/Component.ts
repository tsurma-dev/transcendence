/**
 * Base Component class for scalable SPA structure
 */
export abstract class Component {
  protected element: HTMLElement | null = null

  abstract render(): HTMLElement
  abstract setupEvents(): void
  abstract cleanup(): void

  mount(parent: HTMLElement): void {
    if (this.element) {
      this.unmount()
    }

    this.element = this.render()
    parent.appendChild(this.element)
    this.setupEvents()
  }

  unmount(): void {
    if (this.element) {
      this.cleanup()
      this.element.remove()
      this.element = null
    }
  }
}