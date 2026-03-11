import { BaseComponent } from '../BaseComponent'
import { IconHelper } from '@/core/utils'

import template from './template.html?raw'
import style from './style.scss?inline'

/**
 * PlaylistButtonComponent
 *
 * @export
 * @class PlaylistButtonComponent
 * @extends {BaseComponent}
 */
export default class PlaylistButtonComponent extends BaseComponent
{
  private readonly iconContainer: HTMLElement

  constructor() {
    super()
    this.render(template, style)
    this.iconContainer = this.getElement('.icon-container')!
  }

  connectedCallback()
  {
    IconHelper.loadIcons().then(() => {
      IconHelper.insertIcon(this.iconContainer, 'playlist')
    })
  }
}
