import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import FullscreenButtonComponent from '@/modules/ui/web-components/fullscreen-button'
import { IconHelper } from '@/core/utils'

describe('FullscreenButtonComponent', () => {
  let component: FullscreenButtonComponent

  beforeEach(() => {
    // Mock IconHelper to avoid actual icon loading
    vi.spyOn(IconHelper, 'loadIcons').mockResolvedValue()
    vi.spyOn(IconHelper, 'insertIcon').mockImplementation(() => {})

    // Define the custom element if it's not already defined
    if (!customElements.get('fullscreen-button')) {
      customElements.define('fullscreen-button', FullscreenButtonComponent)
    }
    
    component = document.createElement('fullscreen-button') as FullscreenButtonComponent
    document.body.appendChild(component)
  })

  afterEach(() => {
    document.body.removeChild(component)
    vi.restoreAllMocks()
  })

  it('should create the component', () => {
    expect(component).toBeInstanceOf(FullscreenButtonComponent)
  })

  it('should emit "togglefullscreen" event on button click', () => {
    const emitSpy = vi.spyOn(component, 'emit')
    const button = component.shadowRoot?.querySelector('.j-fullscreen') as HTMLElement
    
    button.click()
    
    expect(emitSpy).toHaveBeenCalledWith('togglefullscreen')
  })

  it('should update the icon to "expand" by default', async () => {
    // connectedCallback is called when appended to DOM
    await vi.runAllTimersAsync() // Wait for IconHelper.loadIcons promise
    expect(IconHelper.insertIcon).toHaveBeenCalledWith(expect.any(HTMLElement), 'expand')
  })

  it('should update the icon to "compress" when setFullscreen(true) is called', async () => {
    component.setFullscreen(true)
    await vi.runAllTimersAsync() // Wait for IconHelper.loadIcons promise
    expect(IconHelper.insertIcon).toHaveBeenCalledWith(expect.any(HTMLElement), 'compress')
  })

  it('should update the icon to "expand" when setFullscreen(false) is called', async () => {
    // First set to true
    component.setFullscreen(true)
    await vi.runAllTimersAsync()
    expect(IconHelper.insertIcon).toHaveBeenCalledWith(expect.any(HTMLElement), 'compress')

    // Then set back to false
    component.setFullscreen(false)
    await vi.runAllTimersAsync()
    expect(IconHelper.insertIcon).toHaveBeenCalledWith(expect.any(HTMLElement), 'expand')
  })
})
