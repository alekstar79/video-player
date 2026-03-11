import { BaseComponent } from '../BaseComponent'
import { IconHelper } from '@/core/utils'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class OpenFileButtonComponent extends BaseComponent
{
  private readonly iconContainer: HTMLElement

  constructor() {
    super()
    this.render(template, styles)
    this.iconContainer = this.getElement('.icon-container')!

    this.shadow.querySelector('button')!.addEventListener('click', () => {
      this.emit('click')
    })
  }

  connectedCallback()
  {
    IconHelper.loadIcons().then(() => {
      IconHelper.insertIcon(this.iconContainer, 'open')
    })
  }
}
