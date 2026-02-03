/**
 * UI component for speed options (view).
 */
export class SpeedOptions
{
  private readonly container: HTMLElement
  private readonly onSpeedChange: (speed: number) => void

  constructor(
    container: HTMLElement,
    onSpeedChange: (speed: number) => void,
    speeds: number[],
    initialSpeed: number
  ) {
    this.container = container
    this.onSpeedChange = onSpeedChange
    this.render(speeds, initialSpeed)
    this.bindEvents()
  }

  private render(speeds: number[], currentSpeed: number): void
  {
    this.container.innerHTML = `
      ${speeds.map(speed => `
        <li
          class="speed-option ${speed === currentSpeed ? 'active' : ''}" 
          data-speed="${speed}"
         >
           ${speed === 1 ? 'Normal' : `${speed}x`}
        </li>
      `).join('')}`
  }

  private bindEvents(): void
  {
    this.handleOptionClick = this.handleOptionClick.bind(this)

    this.container.addEventListener('click', this.handleOptionClick)
  }

  private handleOptionClick(event: MouseEvent): void
  {
    const target = event.target as HTMLElement

    if (target.classList.contains('speed-option')) {
      this.onSpeedChange(parseFloat(target.dataset.speed || '1'))
      this.hide()
    }
  }

  public update(speed: number): void
  {
    this.container.querySelectorAll<HTMLElement>('.speed-option').forEach(option => {
      option.classList.toggle('active', parseFloat(option.dataset.speed || '1') === speed)
    })
  }

  public show(): void
  {
    this.container.classList.add('show')
  }

  public hide(): void
  {
    this.container.classList.remove('show')
  }

  public toggle(): void
  {
    this.container.classList.toggle('show')
  }

  public destroy(): void
  {
    this.container.removeEventListener('click', this.handleOptionClick)
  }
}
