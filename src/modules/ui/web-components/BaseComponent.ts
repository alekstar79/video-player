const externalStyles = `
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
`

let sharedSheet: CSSStyleSheet

export abstract class BaseComponent extends HTMLElement
{
  protected shadow: ShadowRoot

  protected constructor()
  {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })

    if (!sharedSheet) {
      sharedSheet = new CSSStyleSheet()
      sharedSheet.replaceSync(externalStyles)
    }
  }

  protected render(template: string, styles?: string): void
  {
    const componentSheet = new CSSStyleSheet()

    if (styles) {
      componentSheet.replaceSync(styles)
    }

    this.shadow.adoptedStyleSheets = [sharedSheet, componentSheet]

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
