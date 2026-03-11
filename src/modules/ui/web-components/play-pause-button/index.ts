import { BaseComponent } from '../BaseComponent'
import { IconHelper } from '@/core/utils'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class PlayPauseButtonComponent extends BaseComponent
{
  private readonly iconContainer: HTMLElement
  private button: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)
    this.iconContainer = this.shadow.querySelector('.icon-container')!
    this.button = this.shadow.querySelector('.j-toggle-video')!

    this.button.addEventListener('click', () => {
      this.emit('click')
    })
  }

  public setPaused(paused: boolean): void
  {
    this.updateSvgIcon(paused)
  }

  private updateSvgIcon(paused: boolean): void
  {
    IconHelper.loadIcons().then(() => {
      IconHelper.insertIcon(this.iconContainer, paused ? 'play' : 'pause')
    })
  }
}
