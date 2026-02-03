import { BaseComponent } from '../BaseComponent'
import styles from './style.scss?raw'

const template = `
  <button class="player__panel-button j-toggle-loop" title="Loop video">
    <svg class="loop-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <g class="loop-icon__group">
        <path class="loop-icon__number" fill-rule="evenodd" d="M12.475 9.132a.9.9 0 0 1 .429.766V14.1a.9.9 0 0 1-1.8 0v-2.74a.9.9 0 0 1-.807-1.609l1.3-.656a.9.9 0 0 1 .878.037" clip-rule="evenodd"></path>
        <path class="loop-icon__arrows" d="M2.005 12c0-3.258 2.642-5.9 5.902-5.9h10.026l-.564-.564a.9.9 0 1 1 1.273-1.272l2.1 2.1a.9.9 0 0 1 0 1.272l-2.1 2.1a.9.9 0 0 1-1.273-1.272l.564-.564H7.907A4.1 4.1 0 0 0 3.805 12v.097a.9.9 0 0 1-1.8 0zM21.104 11.003a.9.9 0 0 1 .9.9V12c0 3.259-2.642 5.9-5.902 5.9H6.074l.564.564a.9.9 0 1 1-1.273 1.272l-2.101-2.1a.9.9 0 0 1 0-1.272l2.1-2.1a.9.9 0 0 1 1.274 1.272l-.564.564h10.029a4.1 4.1 0 0 0 4.101-4.1v-.097a.9.9 0 0 1 .9-.9"></path>
      </g>
    </svg>
  </button>
`

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
