import { BaseComponent } from '../BaseComponent'
import template from './template.html?raw'
import style from './style.scss?inline'

export default class PreviewButtonComponent extends BaseComponent {
  constructor() {
    super()
    this.render(template, style)
  }
}
