import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { BaseComponent } from '@/modules/ui/web-components/BaseComponent'
import { IconHelper } from '@/core/utils'

// Create a concrete implementation for testing
class TestComponent extends BaseComponent {
  constructor() {
    super()
    this.render('<div class="test">Test Component</div>', '.test { color: red; }')
  }

  getTestElement() {
    return this.getElement<HTMLDivElement>('.test')
  }

  getTestElements() {
    return this.getElements<HTMLDivElement>('.test')
  }

  testEmit() {
    this.emit('test-event', { data: 'test' })
  }

  testCreateIcon() {
    return this.createIcon('test-icon', 'icon-class')
  }

  testGetIcon() {
    return this.getIcon('test-icon')
  }

  testInsertIcon() {
    const element = document.createElement('div')
    this.insertIcon(element, 'test-icon', 'icon-class')
    return element
  }
}

// Register the component
if (!customElements.get('test-component')) {
  customElements.define('test-component', TestComponent)
}

describe('BaseComponent', () => {
  let component: TestComponent

  beforeEach(() => {
    // Mock IconHelper.loadIcons
    vi.spyOn(IconHelper, 'loadIcons').mockResolvedValue(undefined)

    document.body.innerHTML = '<test-component></test-component>'
    component = document.querySelector('test-component') as TestComponent
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should create component with shadow DOM', () => {
      expect(component).toBeInstanceOf(TestComponent)
      expect(component).toBeInstanceOf(HTMLElement)
      expect(component.shadow).toBeDefined()
      expect(component.shadow.mode).toBe('open')
    })

    it('should render template and styles', () => {
      const testElement = component.getTestElement()
      expect(testElement).not.toBeNull()
      expect(testElement?.textContent).toBe('Test Component')

      // Check that styles were added
      const styleElements = component.shadow.querySelectorAll('style')
      expect(styleElements.length).toBe(1)
      expect(styleElements[0].textContent).toContain('.test { color: red; }')
    })
  })

  describe('DOM helpers', () => {
    it('should get element by selector', () => {
      const element = component.getTestElement()
      expect(element).toBeInstanceOf(HTMLDivElement)
      expect(element?.className).toBe('test')
    })

    it('should get elements by selector', () => {
      const elements = component.getTestElements()
      expect(elements.length).toBe(1)
      expect(elements[0].className).toBe('test')
    })

    it('should return null for non-existent element', () => {
      const element = component.getElement('.non-existent')
      expect(element).toBeNull()
    })

    it('should return empty NodeList for non-existent elements', () => {
      const elements = component.getElements('.non-existent')
      expect(elements.length).toBe(0)
    })
  })

  describe('Event emission', () => {
    it('should emit custom events', () => {
      const handler = vi.fn()
      component.addEventListener('test-event', handler)

      component.testEmit()

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0].detail).toEqual({ data: 'test' })
    })

    it('should emit events with bubbles and composed flags', () => {
      const handler = vi.fn()
      component.addEventListener('test-event', handler)

      component.testEmit()

      const event = handler.mock.calls[0][0]
      expect(event.bubbles).toBe(true)
      expect(event.composed).toBe(true)
    })
  })

  describe('Icon helpers', () => {
    beforeEach(() => {
      // Mock IconHelper methods
      vi.spyOn(IconHelper, 'createIconElement').mockReturnValue(
        document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      )
      vi.spyOn(IconHelper, 'getIcon').mockReturnValue('<svg>mock</svg>')
      vi.spyOn(IconHelper, 'insertIcon').mockImplementation(() => {})
    })

    it('should create icon element', () => {
      const icon = component.testCreateIcon()
      expect(icon).toBeInstanceOf(SVGElement)
      expect(IconHelper.createIconElement).toHaveBeenCalledWith('test-icon', 'icon-class')
    })

    it('should get icon HTML', () => {
      const iconHtml = component.testGetIcon()
      expect(iconHtml).toBe('<svg>mock</svg>')
      expect(IconHelper.getIcon).toHaveBeenCalledWith('test-icon')
    })

    it('should insert icon into element', () => {
      const element = component.testInsertIcon()
      expect(IconHelper.insertIcon).toHaveBeenCalledWith(element, 'test-icon', 'icon-class')
    })
  })

  describe('Icon loading', () => {
    it('should load icons during render', () => {
      expect(IconHelper.loadIcons).toHaveBeenCalled()
    })

    it('should handle icon loading errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      vi.spyOn(IconHelper, 'loadIcons').mockRejectedValue(new Error('Failed to load'))

      // Create new component with failed icon loading
      document.body.innerHTML = '<test-component></test-component>'
      const newComponent = document.querySelector('test-component') as TestComponent

      // Wait a tick for the promise to settle
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load icons, component will use fallback'
      )

      consoleWarnSpy.mockRestore()

      void newComponent
    })
  })
})
