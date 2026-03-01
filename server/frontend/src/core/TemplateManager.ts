/**
 * Template Manager for handling HTML templates
 */
export class TemplateManager {
  private static instance: TemplateManager
  private templates: Map<string, HTMLTemplateElement> = new Map()

  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager()
    }
    return TemplateManager.instance
  }

  cloneTemplate(templateId: string): DocumentFragment | null {
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId)!.content.cloneNode(true) as DocumentFragment
    }

    const template = document.getElementById(templateId) as HTMLTemplateElement
    if (template) {
      this.templates.set(templateId, template)
      return template.content.cloneNode(true) as DocumentFragment
    }

    return null
  }
}