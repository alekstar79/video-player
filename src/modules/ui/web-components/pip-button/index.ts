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
    this.button = this.getElement('.j-pic-in-pic') as HTMLButtonElement

    this.button.addEventListener('click', () => {
      this.emit('togglepip')
    })
  }

  public setEnabled(enabled: boolean): void
  {
    this.button.disabled = !enabled
  }
}
