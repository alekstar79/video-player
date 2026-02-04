import { BaseComponent } from '../BaseComponent'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class PipButtonComponent extends BaseComponent
{
  private button: HTMLButtonElement

  constructor()
  {
    super()
    this.render(template, styles)
    this.button = this.shadow.querySelector('.j-pic-in-pic') as HTMLButtonElement

    this.button.addEventListener('click', () => {
      this.emit('click')
    })
  }

  set disabled(value: boolean) {
    this.button.disabled = value
  }

  get disabled(): boolean {
    return this.button.disabled
  }
}
