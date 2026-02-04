import { BaseComponent } from '../BaseComponent'

import template from '/template.html?raw'
import styles from './style.scss?inline'

export default class SkipButtonComponent extends BaseComponent
{
  private button: HTMLElement
  private icon: HTMLElement

  static get observedAttributes()
  {
    return ['direction', 'seconds']
  }

  constructor()
  {
    super()
    this.render(template, styles)
    this.button = this.getElement('button')!
    this.icon = this.getElement('.fas')!

    this.button.addEventListener('click', () => {
      const direction = this.getAttribute('direction') === 'forward' ? 1 : -1
      const seconds = parseInt(this.getAttribute('seconds') || '5', 10)
      this.emit('skip', direction * seconds)
    })
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string)
  {
    if (name === 'direction') {
      this.icon.classList.toggle('fa-backward', newValue === 'backward')
      this.icon.classList.toggle('fa-forward', newValue === 'forward')
      this.button.title = `Skip ${newValue} ${this.getAttribute('seconds') || 5}s`
    }
    if (name === 'seconds') {
      this.button.title = `Skip ${this.getAttribute('direction')} ${newValue}s`
    }
  }
}
