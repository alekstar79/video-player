import { BaseComponent } from '../BaseComponent'
import styles from './style.scss?raw'

const template = `
  <button class="player__panel-button j-toggle-video" title="Play/Pause">
    <em class="fas fa-play"></em>
  </button>
`

export default class PlayPauseButtonComponent extends BaseComponent
{
  private button: HTMLElement
  private icon: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)
    this.button = this.getElement('.j-toggle-video')!
    this.icon = this.getElement('.fas')!

    this.button.addEventListener('click', () => {
      this.emit('toggleplay')
    })
  }

  public setPlayIcon(): void
  {
    this.icon.className = 'fas fa-play'
  }

  public setPauseIcon(): void
  {
    this.icon.className = 'fas fa-pause'
  }
}
