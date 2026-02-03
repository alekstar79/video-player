import { BaseComponent } from '../BaseComponent'
import styles from './style.scss?raw'

const template = `
  <button class="player__panel-button" title="Volume">
    <em class="fas fa-volume-up player__volume-icon"></em>
    <input type="range" class="player__volume j-volume-input">
  </button>
`

export default class VolumeControlComponent extends BaseComponent
{
  private readonly slider: HTMLInputElement
  private button: HTMLElement
  private icon: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)

    this.button = this.getElement('button')!
    this.slider = this.getElement('.j-volume-input') as HTMLInputElement
    this.icon = this.getElement('.fas') as HTMLElement

    this.slider.addEventListener('input', (event) => {
      const value = parseInt((event.target as HTMLInputElement).value)
      this.emit('volumechange', value / 100)
    })

    this.button.addEventListener('click', (event) => {
      if (event.target === this.slider) return

      event.stopPropagation()
      this.emit('mutetoggle')
    })
  }

  public setVolume(volume: number): void
  {
    this.slider.value = String(volume * 100)
  }

  public updateIcon(volume: number, muted: boolean): void
  {
    this.icon.className = 'fas player__volume-icon'

    if (muted || volume === 0) {
      this.icon.classList.add('fa-volume-mute')
    } else if (volume > 0.66) {
      this.icon.classList.add('fa-volume-up')
    } else if (volume > 0.33) {
      this.icon.classList.add('fa-volume-down')
    } else {
      this.icon.classList.add('fa-volume-off')
    }
  }
}
