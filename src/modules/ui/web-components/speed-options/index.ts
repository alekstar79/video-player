import { BaseComponent } from '../BaseComponent'
import styles from './style.scss?raw'

const template = `
  <div class="player__panel-playback-content">
    <button class="player__panel-button j-speed" title="Playback speed">
      <span class="material-symbols-rounded">slow_motion_video</span>
    </button>
    <ul class="player__panel-speed-options j-speed-options">
      <li data-speed="2">2x</li>
      <li data-speed="1.5">1.5x</li>
      <li data-speed="1" class="active">Normal</li>
      <li data-speed="0.75">0.75x</li>
      <li data-speed="0.5">0.5x</li>
    </ul>
  </div>
`

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
