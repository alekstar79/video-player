const externalStyleLinks = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
]

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
    // Add external icon libraries
    externalStyleLinks.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      this.shadow.appendChild(link)
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
    this.dispatchEvent(
      new CustomEvent(eventName, { bubbles: true, composed: true, detail })
    )
  }
}
