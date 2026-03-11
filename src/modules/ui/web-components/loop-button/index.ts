import { BaseComponent } from '../BaseComponent'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class LoopButtonComponent extends BaseComponent
{
  private button: HTMLElement
  private loopIcon: SVGElement

  constructor()
  {
    super()
    this.render(template, styles)
    this.button = this.getElement('.j-toggle-loop')!
    this.loopIcon = this.getElement('.loop-icon')!

    this.button.addEventListener('click', () => {
      this.emit('toggleloop')
    })
  }

  public setMode(mode: 'none' | 'one' | 'all'): void
  {
    this.loopIcon.classList.remove('loop-icon--none', 'loop-icon--one', 'loop-icon--all')
    this.loopIcon.classList.add(`loop-icon--${mode}`)

    switch (mode) {
      case 'none':
        this.button.title = 'Enable loop'
        break
      case 'one':
        this.button.title = 'Loop current video'
        break
      case 'all':
        this.button.title = 'Loop playlist'
        break
    }
  }
}
