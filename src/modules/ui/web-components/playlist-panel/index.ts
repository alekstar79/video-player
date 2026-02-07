import { BaseComponent } from '../BaseComponent'
import template from './template.html?raw'
import style from './style.scss?inline'

const ATTRIBUTES = { VISIBLE: 'visible' }

/**
 * PlaylistPanelComponent
 *
 * @export
 * @class PlaylistPanelComponent
 * @extends {BaseComponent}
 */
export default class PlaylistPanelComponent extends BaseComponent
{
  private listElement!: HTMLElement
  private handleElement!: HTMLElement
  private closeButton!: HTMLElement
  private emptyMessage!: HTMLElement
  private isDragging = false
  private offsetX = 0
  private offsetY = 0

  private _sources: string[] = []
  private _activeIndex: number = -1

  constructor()
  {
    super()
    this.render(template, style)
  }

  connectedCallback()
  {
    this.id = 'playlist-panel'
    this.listElement = this.shadow.querySelector('.playlist__list')!
    this.handleElement = this.shadow.querySelector('.playlist__handle')!
    this.closeButton = this.shadow.querySelector('.playlist__close-btn')!
    this.emptyMessage = this.shadow.querySelector('.playlist__empty-message')!

    this.bindEvents()
  }

  static get observedAttributes()
  {
    return Object.values(ATTRIBUTES)
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string)
  {
    if (name === ATTRIBUTES.VISIBLE) {
      this.style.display = newValue !== null ? 'block' : 'none'
    }
  }

  set sources(sources: string[])
  {
    this._sources = sources
    this.renderList()
  }

  set activeIndex(index: number)
  {
    this._activeIndex = index
    this.updateActiveItem()
  }

  private bindEvents()
  {
    this.onItemClick = this.onItemClick.bind(this)
    this.onCloseClick = this.onCloseClick.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragMove = this.onDragMove.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)

    this.listElement.addEventListener('click', this.onItemClick)
    this.closeButton.addEventListener('click', this.onCloseClick)
    this.handleElement.addEventListener('mousedown', this.onDragStart)

    document.addEventListener('mousemove', this.onDragMove)
    document.addEventListener('mouseup', this.onDragEnd)
  }

  private renderList()
  {
    if (!this.listElement) return

    const hasSources = this._sources.length > 0
    this.listElement.style.display = hasSources ? '' : 'none'
    this.emptyMessage.style.display = hasSources ? 'none' : 'block'

    if (!hasSources) return

    this.listElement.innerHTML = ''
    this._sources.forEach((source, index) => {
      const li = document.createElement('li')

      li.classList.add('playlist__item')
      li.dataset.index = String(index)
      li.textContent = source

      if (index === this._activeIndex) {
        li.classList.add('playlist__item--active')
      }

      this.listElement.appendChild(li)
    })
  }

  private updateActiveItem()
  {
    if (!this.listElement) return

    this.shadow.querySelectorAll('.playlist__item').forEach((item, index) => {
      item.classList.toggle('playlist__item--active', index === this._activeIndex)
    })
  }

  private onItemClick(event: Event)
  {
    const target = event.target as HTMLElement

    if (target.matches('.playlist__item')) {
      this.dispatchEvent(
        new CustomEvent('itemclick', {
          detail: { index: Number(target.dataset.index) }
        })
      )
    }
  }

  private onCloseClick()
  {
    this.dispatchEvent(new CustomEvent('close'))
  }

  private onDragStart(event: MouseEvent)
  {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.playlist__close-btn')) {
      return
    }

    this.isDragging = true
    this.offsetX = event.clientX - this.getBoundingClientRect().left
    this.offsetY = event.clientY - this.getBoundingClientRect().top
    this.style.cursor = 'grabbing'

    document.body.style.userSelect = 'none'
  }

  private onDragMove(event: MouseEvent)
  {
    if (!this.isDragging) return

    event.preventDefault()

    let newX = event.clientX - this.offsetX
    let newY = event.clientY - this.offsetY

    const myRect = this.getBoundingClientRect()

    newX = Math.max(0, Math.min(newX, window.innerWidth - myRect.width))
    newY = Math.max(0, Math.min(newY, window.innerHeight - myRect.height))

    this.style.left = `${newX}px`
    this.style.top = `${newY}px`
  }

  private onDragEnd()
  {
    this.isDragging = false
    this.style.cursor = 'grab'

    document.body.style.userSelect = ''
  }

  disconnectedCallback()
  {
    this.handleElement.removeEventListener('mousedown', this.onDragStart)

    document.removeEventListener('mousemove', this.onDragMove)
    document.removeEventListener('mouseup', this.onDragEnd)

    this.listElement.removeEventListener('click', this.onItemClick)
    this.closeButton.removeEventListener('click', this.onCloseClick)
  }
}
