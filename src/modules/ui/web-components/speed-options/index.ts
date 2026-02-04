import { BaseComponent } from '../BaseComponent'

import template from './template.html?raw'
import styles from './style.scss?raw'

export default class SpeedOptionsComponent extends BaseComponent
{
  private speedButton: HTMLElement
  private speedOptions: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)

    this.speedButton = this.getElement('.j-speed')!
    this.speedOptions = this.getElement('.j-speed-options')!

    this.speedButton.addEventListener('click', () => {
      this.speedOptions.classList.toggle('show')
    })

    this.speedOptions.addEventListener('click', (event) => {
      const target = event.target as HTMLElement

      if (target.tagName === 'LI') {
        const speed = parseFloat(target.dataset.speed || '1')
        this.emit('speedchange', speed)
        this.speedOptions.classList.remove('show')
      }
    })
  }

  public update(speed: number): void
  {
    this.speedOptions.querySelectorAll('li').forEach(option => {
      option.classList.toggle('active', parseFloat(option.dataset.speed || '1') === speed)
    })
  }
}
