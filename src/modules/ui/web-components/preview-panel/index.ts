import { Filesystem, Helpers } from '@/core/utils'
import { BaseComponent } from '../BaseComponent'

import template from './template.html?raw'
import style from './style.scss?inline'

const ATTRIBUTES = { VISIBLE: 'visible' }

export interface IPreviewData {
  blob: Blob | null;
  filename: string;
  resolution: string;
  timestamp: number;
  size: number;
}

export default class PreviewPanelComponent extends BaseComponent
{
  private previewImage!: HTMLImageElement
  private infoFilename!: HTMLElement
  private infoResolution!: HTMLElement
  private infoTimestamp!: HTMLElement
  private infoSize!: HTMLElement

  private generateButton!: HTMLButtonElement
  private saveButton!: HTMLButtonElement
  private closeButton!: HTMLButtonElement
  private handleElement!: HTMLElement

  private currentBlob: Blob | null = null
  private currentFilename: string = 'preview.jpg'

  private isDragging = false
  private offsetX = 0
  private offsetY = 0

  constructor()
  {
    super()
    this.render(template, style)
  }

  static get observedAttributes()
  {
    return Object.values(ATTRIBUTES)
  }

  attributeChangedCallback(name: string, _: string, newValue: string)
  {
    if (name === ATTRIBUTES.VISIBLE) {
      this.style.display = newValue !== null ? 'block' : 'none'
    }
  }

  connectedCallback()
  {
    this.id = 'preview-panel'
    this.previewImage = this.shadow.querySelector('.preview__image')!
    this.infoFilename = this.shadow.querySelector('[data-info="filename"]')!
    this.infoResolution = this.shadow.querySelector('[data-info="resolution"]')!
    this.infoTimestamp = this.shadow.querySelector('[data-info="timestamp"]')!
    this.infoSize = this.shadow.querySelector('[data-info="size"]')!

    this.generateButton = this.shadow.querySelector('.preview__btn--generate')!
    this.saveButton = this.shadow.querySelector('.preview__btn--save')!
    this.closeButton = this.shadow.querySelector('.preview__close-btn')!
    this.handleElement = this.shadow.querySelector('.preview__handle')!

    this.bindClickEventHandlers()
    this.bindDragEventHandlers()
  }

  public update(data: IPreviewData)
  {
    this.currentBlob = data.blob
    this.currentFilename = data.filename

    if (data.blob) {
      this.previewImage.src = URL.createObjectURL(data.blob)
      this.previewImage.style.display = 'block'
    } else {
      this.clear()
    }

    this.infoFilename.textContent = data.filename
    this.infoResolution.textContent = data.resolution
    this.infoTimestamp.textContent = Helpers.formatTime(data.timestamp)
    this.infoSize.textContent = Filesystem.formatFileSize(data.size)
  }

  public clear()
  {
    if (this.previewImage.src) {
      URL.revokeObjectURL(this.previewImage.src)
    }
    this.previewImage.src = ''
    this.previewImage.style.display = 'none'
    this.infoFilename.textContent = '-'
    this.infoResolution.textContent = '-'
    this.infoTimestamp.textContent = '-'
    this.infoSize.textContent = '-'
    this.currentBlob = null
  }

  private bindClickEventHandlers()
  {
    this.generateButton.addEventListener('click', () => this.emit('generate'))
    this.saveButton.addEventListener('click', () => this.savePreview())
    this.closeButton.addEventListener('click', () => this.emit('close'))
  }

  private savePreview() {
    if (!this.currentBlob) {
      console.warn('No preview blob to save.')
      return
    }
    Filesystem.saveFile(this.currentBlob, this.currentFilename)
  }

  private bindDragEventHandlers()
  {
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragMove = this.onDragMove.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)

    this.handleElement.addEventListener('mousedown', this.onDragStart)

    document.addEventListener('mousemove', this.onDragMove)
    document.addEventListener('mouseup', this.onDragEnd)
  }

  // Drag and drop logic
  private onDragStart(event: MouseEvent)
  {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.preview__close-btn')) {
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
  }
}
