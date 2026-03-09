import { describe, it, expect, beforeEach, vi } from 'vitest'
import PreviewPanelComponent, { IPreviewData } from '../../modules/ui/web-components/preview-panel'
import { Filesystem, Helpers } from '@/core/utils'

// Register the custom element
if (!customElements.get('preview-panel')) {
  customElements.define('preview-panel', PreviewPanelComponent)
}

describe('PreviewPanelComponent', () => {
  let component: PreviewPanelComponent

  beforeEach(() => {
    document.body.innerHTML = '<preview-panel></preview-panel>'
    component = document.querySelector('preview-panel') as PreviewPanelComponent
  })

  it('should render correctly', () => {
    expect(component).toBeInstanceOf(PreviewPanelComponent)
    expect(component.shadowRoot).not.toBeNull()
  })

  it('should update with new data', async () => {
    const blob = new Blob(['preview'], { type: 'image/jpeg' })
    const data: IPreviewData = {
      blob,
      filename: 'test.jpg',
      resolution: '1920x1080',
      timestamp: 12345,
      size: 1024,
    }

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-url')

    component.update(data)

    const img = component.shadowRoot!.querySelector('.preview__image') as HTMLImageElement
    const filenameEl = component.shadowRoot!.querySelector('[data-info="filename"]')
    const resolutionEl = component.shadowRoot!.querySelector('[data-info="resolution"]')
    const timestampEl = component.shadowRoot!.querySelector('[data-info="timestamp"]')
    const sizeEl = component.shadowRoot!.querySelector('[data-info="size"]')

    expect(img.src).toBe('blob:http://localhost/mock-url')
    expect(filenameEl?.textContent).toBe('test.jpg')
    expect(resolutionEl?.textContent).toBe('1920x1080')
    expect(timestampEl?.textContent).toBe(Helpers.formatTime(12345))
    expect(sizeEl?.textContent).toBe(Filesystem.formatFileSize(1024))
  })

  it('should emit a "close" event when the close button is clicked', () => {
    const spy = vi.fn()
    component.addEventListener('close', spy)

    const closeButton = component.shadowRoot!.querySelector('.preview__close-btn') as HTMLElement
    closeButton.click()

    expect(spy).toHaveBeenCalled()
  })
})
