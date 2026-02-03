import { BaseComponent } from '../BaseComponent'
import styles from './style.scss?raw'

const template = `
  <button class="player__panel-button j-pic-in-pic" title="Picture in Picture">
    <span class="material-icons">picture_in_picture_alt</span>
  </button>
`

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
