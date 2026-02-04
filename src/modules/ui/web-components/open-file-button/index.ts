import { BaseComponent } from '../BaseComponent'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class OpenFileButtonComponent extends BaseComponent {
  constructor() {
    super()
    this.render(template, styles)

    this.shadow.querySelector('button')!.addEventListener('click', () => {
      this.emit('click')
    })
  }
}
