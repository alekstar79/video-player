import { BaseComponent } from '../BaseComponent'
import { IconHelper } from '@/core/utils'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class VolumeControlComponent extends BaseComponent
{
  private readonly iconContainer: HTMLElement
  private readonly slider: HTMLInputElement
  private button: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)

    this.iconContainer = this.shadow.querySelector('.icon-container')!
    this.slider = this.shadow.querySelector('.j-volume-input')!
    this.button = this.shadow.querySelector('button')!

    this.slider.addEventListener('input', (event) => {
      const value = parseFloat((event.target as HTMLInputElement).value)
      this.emit('volumechange', { volume: value })
    })

    this.slider.addEventListener('mouseleave', () => {
      this.slider.blur()
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
    this.updateIcon(volume, false)
  }

  public getVolume(): number
  {
    return parseFloat(this.slider.value)
  }

  public updateIcon(volume: number, muted: boolean): void
  {
    IconHelper.loadIcons().then(() => {
      let iconId = 'volume'

      if (muted || volume === 0) {
        iconId = 'volume-xmark'
      } else if (volume > 0.66) {
        iconId = 'volume-high'
      }

      IconHelper.insertIcon(this.iconContainer, iconId)
    })
  }
}
