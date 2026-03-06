import { BaseComponent } from '../BaseComponent'
import { IconHelper } from '@/core/utils'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class SkipButtonComponent extends BaseComponent
{
  private readonly iconContainer: HTMLElement
  private button: HTMLElement

  static get observedAttributes()
  {
    return ['direction', 'seconds']
  }

  constructor()
  {
    super()
    this.render(template, styles)
    this.iconContainer = this.getElement('.icon-container')!
    this.button = this.getElement('button')!

    this.button.addEventListener('click', () => {
      const direction = this.getAttribute('direction') === 'forward' ? 1 : -1
      const seconds = parseInt(this.getAttribute('seconds') || '5', 10)
      this.emit('skip', direction * seconds)
    })
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string)
  {
    if (name === 'direction') {
      this.updateIcon(newValue)
      this.button.title = `Skip ${newValue}`
    }
    if (name === 'seconds') {
      this.button.title = `Skip ${this.getAttribute('direction')}`
    }
  }

  public updateIcon(iconId: string): void
  {
    IconHelper.loadIcons().then(() => {
      IconHelper.insertIcon(this.iconContainer, iconId)
    })
  }
}
