export class IconHelper {
  private static iconsLoaded = false
  private static iconsCache: Map<string, string> = new Map()
  private static attempt = false
  private static svgText = ''

  public static async fetch(url: string): Promise<string> {
    const base = import.meta.env.BASE_URL || '/'
    const response = await fetch(`${base}${url}`)

    return response.ok ? response.text() : ''
  }

  public static async getDefaultIcons(): Promise<string> {
    const svgText = await import('./default.svg?raw')
    return svgText.default
  }

  /**
   * Load icons from the SVG sprite
   */
  public static async loadIcons(
    url: string = 'icons.svg',
    defaultIcons: boolean = true
  ): Promise<string> {
    if (this.iconsLoaded) return this.svgText

    try {
      this.svgText = defaultIcons ? await this.getDefaultIcons() : await this.fetch(url)

      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(this.svgText, 'image/svg+xml')
      const parserError = svgDoc.querySelector('parsererror')

      if (parserError && !this.attempt) {
        this.attempt = true
        return this.loadIcons(url, true)
      }

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

      this.iconsLoaded = !!this.iconsCache.size
    } catch (error) {
      console.error('Failed to load icons:', error)
    }

    return this.svgText
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
