export class IconHelper {
  private static iconsLoaded = false
  private static iconsCache: Map<string, string> = new Map()

  /**
   * Load icons from the SVG sprite
   */
  public static async loadIcons(): Promise<void> {
    if (this.iconsLoaded) return

    try {
      const base = import.meta.env.BASE_URL || '/'
      const response = await fetch(`${base}icons.svg`)
      const svgText = await response.text()
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')

      // Extract all symbol definitions
      svgDoc.querySelectorAll<SVGElement>('svg > g')
        .forEach(group => {
          const path = group.querySelector('path')!
          const id = path.id

          if (id) {
            // Create SVG element with the path
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
            svg.setAttribute('viewBox', '0 0 48 48')
            svg.setAttribute('fill', 'currentColor')
            svg.innerHTML = group.innerHTML
            this.iconsCache.set(id, svg.outerHTML)
          }
        })

      this.iconsLoaded = true
    } catch (error) {
      console.error('Failed to load icons:', error)
    }
  }

  /**
   * Get SVG icon by id
   */
  public static getIcon(id: string): string {
    return this.iconsCache.get(id) || `<svg viewBox="0 0 48 48" fill="currentColor"><text x="24" y="24" text-anchor="middle" dy=".3em">?</text></svg>`
  }

  /**
   * Create icon element
   */
  public static createIconElement(id: string, className?: string): SVGElement {
    const parser = new DOMParser()
    const svgString = this.getIcon(id)
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgElement = svgDoc.documentElement as unknown as SVGElement

    if (className) {
      svgElement.classList.add(...className.split(' '))
    }

    return svgElement
  }

  /**
   * Insert icon into element
   */
  public static insertIcon(element: Element, iconId: string, className?: string): void {
    const icon = this.createIconElement(iconId, className)

    element.innerHTML = ''
    element.appendChild(icon)
  }

  /**
   * Get available icon ids
   */
  public static getAvailableIcons(): string[] {
    return Array.from(this.iconsCache.keys())
  }
}
