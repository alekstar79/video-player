import { BaseComponent } from '../BaseComponent'
import { IconHelper } from '@/core/utils'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class FullscreenButtonComponent extends BaseComponent
{
  private readonly iconContainer: HTMLElement
  private button: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)
    this.button = this.getElement('.j-fullscreen')!
    this.iconContainer = this.getElement('.icon-container')!

    this.button.addEventListener('click', () => {
      this.emit('togglefullscreen')
    })
  }

  connectedCallback()
  {
    this.updateSvgIcon(false)
  }

  public setFullscreen(isFullscreen: boolean): void
  {
    this.updateSvgIcon(isFullscreen)
  }

  private updateSvgIcon(isFullscreen: boolean): void
  {
    IconHelper.loadIcons().then(() => {
      IconHelper.insertIcon(this.iconContainer, isFullscreen ? 'compress' : 'expand')
    })
  }
}
