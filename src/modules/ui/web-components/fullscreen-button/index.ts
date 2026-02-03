import { BaseComponent } from '../BaseComponent'
import styles from './style.scss?raw'

const template = `
  <button class="player__panel-button j-fullscreen" title="Fullscreen">
    <em class="fas fa-expand"></em>
  </button>
`

export default class FullscreenButtonComponent extends BaseComponent
{
  private button: HTMLElement
  private icon: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)
    this.button = this.getElement('.j-fullscreen')!
    this.icon = this.getElement('.fas')!

    this.button.addEventListener('click', () => {
      this.emit('togglefullscreen')
    })
  }

  public setFullscreen(isFullscreen: boolean): void
  {
    this.icon.className = isFullscreen ? 'fas fa-compress' : 'fas fa-expand'
  }
}
