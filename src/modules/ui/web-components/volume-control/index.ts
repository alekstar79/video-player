import { BaseComponent } from '../BaseComponent'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class VolumeControlComponent extends BaseComponent
{
  private readonly slider: HTMLInputElement
  private button: HTMLElement
  private icon: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)

    this.button = this.shadow.querySelector('button')!
    this.slider = this.shadow.querySelector('.j-volume-input') as HTMLInputElement
    this.icon = this.shadow.querySelector('.fas') as HTMLElement

    this.slider.addEventListener('input', (event) => {
      const value = parseFloat((event.target as HTMLInputElement).value)
      this.emit('volumechange', { volume: value })
    })

    this.button.addEventListener('click', (event) => {
      if (event.target === this.slider) return

      event.stopPropagation()
      this.emit('mutetoggle')
    })
  }

  public setVolume(volume: number): void
  {
    this.slider.value = String(volume)
  }

  public getVolume(): number
  {
    return parseFloat(this.slider.value)
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
