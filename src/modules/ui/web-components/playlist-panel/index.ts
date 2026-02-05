import { BaseComponent } from '../BaseComponent'
import template from './template.html?raw'
import style from './style.scss?inline'

const ATTRIBUTES = {
  VISIBLE: 'visible',
}

/**
 * PlaylistPanelComponent
 *
 * @export
 * @class PlaylistPanelComponent
 * @extends {BaseComponent}
 */
export default class PlaylistPanelComponent extends BaseComponent {
  private _sources: string[] = []
  private _activeIndex: number = -1

  private listElement: HTMLElement
  private handleElement: HTMLElement
  private isDragging = false
  private offsetX = 0
  private offsetY = 0

  constructor() {
    super()
    this.render(template, style)
    this.listElement = this.shadow.querySelector('.playlist__list')!
    this.handleElement = this.shadow.querySelector('.playlist__handle')!

    this.handleElement.addEventListener('mousedown', this.onDragStart)
    document.addEventListener('mousemove', this.onDragMove)
    document.addEventListener('mouseup', this.onDragEnd)
    this.listElement.addEventListener('click', this.onItemClick)
  }

  static get observedAttributes() {
    return Object.values(ATTRIBUTES)
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === ATTRIBUTES.VISIBLE) {
      this.style.display = newValue !== null ? 'block' : 'none'
    }
  }

  set sources(sources: string[]) {
    this._sources = sources
    this.renderList()
  }

  set activeIndex(index: number) {
    this._activeIndex = index
    this.updateActiveItem()
  }

  private renderList() {
    this.listElement.innerHTML = ''
    this._sources.forEach((source, index) => {
      const li = document.createElement('li')
      li.classList.add('playlist__item')
      li.dataset.index = String(index)
      li.textContent = source // Просто используем переданное название
      if (index === this._activeIndex) {
        li.classList.add('playlist__item--active')
      }
      this.listElement.appendChild(li)
    })
  }

  private updateActiveItem() {
    this.shadow.querySelectorAll('.playlist__item').forEach((item, index) => {
      item.classList.toggle('playlist__item--active', index === this._activeIndex)
    })
  }

  private onItemClick = (event: Event) => {
    const target = event.target as HTMLElement
    if (target.matches('.playlist__item')) {
      const index = Number(target.dataset.index)
      this.dispatchEvent(new CustomEvent('itemclick', { detail: { index } }))
    }
  }

  private onDragStart = (event: MouseEvent) => {
    this.isDragging = true
    this.offsetX = event.clientX - this.getBoundingClientRect().left
    this.offsetY = event.clientY - this.getBoundingClientRect().top
    this.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none';
  }

  private onDragMove = (event: MouseEvent) => {
    if (!this.isDragging) return
    
    event.preventDefault();

    let newX = event.clientX - this.offsetX
    let newY = event.clientY - this.offsetY
    
    const myRect = this.getBoundingClientRect()

    newX = Math.max(0, Math.min(newX, window.innerWidth - myRect.width))
    newY = Math.max(0, Math.min(newY, window.innerHeight - myRect.height))

    this.style.left = `${newX}px`
    this.style.top = `${newY}px`
  }

  private onDragEnd = () => {
    this.isDragging = false
    this.style.cursor = 'grab'
    document.body.style.userSelect = '';
  }

  disconnectedCallback() {
    this.handleElement.removeEventListener('mousedown', this.onDragStart)
    document.removeEventListener('mousemove', this.onDragMove)
    document.removeEventListener('mouseup', this.onDragEnd)
    this.listElement.removeEventListener('click', this.onItemClick)
  }
}
