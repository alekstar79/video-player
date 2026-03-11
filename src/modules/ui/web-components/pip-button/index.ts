import { BaseComponent } from '../BaseComponent'
import { IconHelper } from '@/core/utils'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class PipButtonComponent extends BaseComponent
{
  private readonly iconContainer: HTMLElement
  private button: HTMLButtonElement

  constructor()
  {
    super()
    this.render(template, styles)
    this.iconContainer = this.shadow.querySelector('.icon-container')!
    this.button = this.shadow.querySelector('.j-pic-in-pic')!

    this.button.addEventListener('click', () => {
      this.emit('click')
    })
  }

  connectedCallback()
  {
    IconHelper.loadIcons().then(() => {
      IconHelper.insertIcon(this.iconContainer, 'picture-in-picture')
    })
  }

  set disabled(value: boolean) {
    this.button.disabled = value
  }

  get disabled(): boolean {
    return this.button.disabled
  }
}
