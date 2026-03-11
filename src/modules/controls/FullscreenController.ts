import type { BoundingEventHandler, CustomChangeCallback, FullscreenHandler, FullscreenMethodMapping } from '@/types'

const methodMappings: FullscreenMethodMapping[] = [
  {
    request: 'requestFullscreen',
    exit: 'exitFullscreen',
    element: 'fullscreenElement',
    enabled: 'fullscreenEnabled',
    change: 'fullscreenchange',
    error: 'fullscreenerror'
  },
  {
    request: 'webkitRequestFullscreen',
    exit: 'webkitExitFullscreen',
    element: 'webkitFullscreenElement',
    enabled: 'webkitFullscreenEnabled',
    change: 'webkitfullscreenchange',
    error: 'webkitfullscreenerror'
  },
  {
    request: 'webkitRequestFullScreen',
    exit: 'webkitCancelFullScreen',
    element: 'webkitCurrentFullScreenElement',
    enabled: 'webkitFullscreenEnabled',
    change: 'webkitfullscreenchange',
    error: 'webkitfullscreenerror'
  },
  {
    request: 'mozRequestFullScreen',
    exit: 'mozCancelFullScreen',
    element: 'mozFullScreenElement',
    enabled: 'mozFullScreenEnabled',
    change: 'mozfullscreenchange',
    error: 'mozfullscreenerror'
  },
  {
    request: 'msRequestFullscreen',
    exit: 'msExitFullscreen',
    element: 'msFullscreenElement',
    enabled: 'msFullscreenEnabled',
    change: 'MSFullscreenChange',
    error: 'MSFullscreenError'
  }
]

export class FullscreenController implements FullscreenHandler
{
  get supportedAPI(): FullscreenMethodMapping | undefined {
    return methodMappings.find(this.methodFinder)
  }

  get element(): Element | null {
    return this.supportedAPI?.element
      ? (document as any)[this.supportedAPI.element]
      : null
  }

  get isEnabled(): boolean {
    return this.supportedAPI?.enabled
      ? Boolean((document as any)[this.supportedAPI.enabled])
      : false
  }

  get isFullscreen(): boolean {
    return Boolean(this.element)
  }

  get requestMethod(): string {
    return this.supportedAPI?.request as string
  }

  get exitMethod(): string {
    return this.supportedAPI?.exit as string
  }

  private readonly boundHandlerChange: BoundingEventHandler | undefined
  private readonly boundHandlerError: BoundingEventHandler | undefined
  private readonly el: Element | undefined

  constructor(
    el: Element,
    onChangeHandler?: CustomChangeCallback,
    onErrorHandler?: CustomChangeCallback
  ) {
    this.el = el

    if (!this.supportedAPI) {
      console.warn('Fullscreen is not supported in this browser')
      return
    }

    this.boundHandlerChange = (ev: Event) => onChangeHandler?.(this.isFullscreen, ev)
    this.boundHandlerError = (ev: Event) => onErrorHandler?.(this.isFullscreen, ev)

    this.on('change', this.boundHandlerChange)
    this.on('error', this.boundHandlerError)
  }

  private methodFinder(mapping: FullscreenMethodMapping)
  {
    return mapping.request in document.documentElement
  }

  /**
   * @method
   * @name FullscreenController.createFullscreenPromise
   * @param {(function(): Promise<boolean>)} execute
   * @returns {Promise<boolean>}
   */
  createFullscreenPromise(execute: () => Promise<void>): Promise<boolean>
  {
    return new Promise((resolve, reject) => {
      execute()
        .then(() => resolve(this.isFullscreen))
        .catch((e: Error) => reject(e))
        .finally(() => {})
    })
  }

  async request(element?: Element, options?: FullscreenOptions): Promise<boolean>
  {
    if (!this.isEnabled) {
      throw new Error('Fullscreen is not enabled')
    }

    options ??= { navigationUI: 'auto' }
    element ??= this.el

    return await this.createFullscreenPromise(
      () => (element as any)[this.requestMethod](options)
    )
  }

  async exit(): Promise<boolean>
  {
    if (this.isFullscreen) {
      return await this.createFullscreenPromise(
        () => (document as any)[this.exitMethod]()
      )
    }

    return false
  }

  async toggle(element?: Element, options?: FullscreenOptions): Promise<boolean>
  {
    options ??= { navigationUI: 'auto' }
    element ??= this.el

    return await (
      this.isFullscreen
        ? this.exit()
        : this.request(element, options)
    )
  }

  on(event: 'change' | 'error', callback: BoundingEventHandler): void
  {
    const eventName = this.supportedAPI?.[event]

    if (eventName) {
      document.addEventListener(eventName, callback, false)
    }
  }

  off(event: 'change' | 'error', callback: BoundingEventHandler): void
  {
    const eventName = this.supportedAPI?.[event]

    if (eventName) {
      document.removeEventListener(eventName, callback, false)
    }
  }

  onchange(callback: BoundingEventHandler): void
  {
    this.on('change', callback)
  }

  onerror(callback: BoundingEventHandler): void
  {
    this.on('error', callback)
  }

  /**
   * The method is not needed in this implementation.
   * It is retained for compatibility with the old API.
   */
  destroy(): void
  {
    this.boundHandlerChange && this.off('change', this.boundHandlerChange)
    this.boundHandlerError && this.off('error', this.boundHandlerError)
  }
}
