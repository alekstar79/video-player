import { IconHelper } from '@/core/utils'

export abstract class BaseComponent extends HTMLElement
{
  protected shadow: ShadowRoot

  protected constructor()
  {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  protected render(template: string, styles?: string): void
  {
    // Preload icons before rendering
    IconHelper.loadIcons().catch(() => {
      console.warn('Failed to load icons, component will use fallback')
    })

    // Add component-specific styles
    if (styles) {
      const styleElement = document.createElement('style')
      styleElement.textContent = styles
      this.shadow.appendChild(styleElement)
    }

    // Add component HTML template
    const templateElement = document.createElement('template')
    templateElement.innerHTML = template
    this.shadow.appendChild(templateElement.content.cloneNode(true))
  }

  protected getElement<T extends HTMLElement | SVGElement>(selector: string): T | null
  {
    return this.shadow.querySelector<T>(selector)
  }

  protected getElements<T extends HTMLElement | SVGElement>(selector: string): NodeListOf<T>
  {
    return this.shadow.querySelectorAll<T>(selector)
  }

  protected emit<T>(eventName: string, detail?: T): void
  {
    this.dispatchEvent(new CustomEvent(eventName, { bubbles: true, composed: true, detail }))
  }

  /**
   * Helper to create SVG icon element
   */
  protected createIcon(iconId: string, className?: string): SVGElement {
    return IconHelper.createIconElement(iconId, className)
  }

  /**
   * Helper to get icon HTML
   */
  protected getIcon(iconId: string): string {
    return IconHelper.getIcon(iconId)
  }

  /**
   * Helper to insert icon into element
   */
  protected insertIcon(element: Element, iconId: string, className?: string): void {
    IconHelper.insertIcon(element, iconId, className)
  }
}
