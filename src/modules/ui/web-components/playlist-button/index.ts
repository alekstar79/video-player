import { BaseComponent } from '../BaseComponent'
import template from './template.html?raw'
import style from './style.scss?inline'

/**
 * PlaylistButtonComponent
 *
 * @export
 * @class PlaylistButtonComponent
 * @extends {BaseComponent}
 */
export default class PlaylistButtonComponent extends BaseComponent {
  constructor() {
    super()
    this.render(template, style)
  }
}
