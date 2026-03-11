/**
 * Utility for opening file dialog - replacement for old utils.js open function
 */
export class Filesystem
{
  static BINARY = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  static DECIMAL = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  /**
   * Checks if the modern File System Access API is supported.
   */
  static isPickerSupported(): boolean
  {
    return typeof showOpenFilePicker === 'function'
  }

  static createInput({ accept, multiple }: { accept: string; multiple: boolean })
  {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple

    // Hide the input element
    input.style.visibility = 'hidden'
    input.style.position = 'fixed'
    input.style.left = '-1000px'
    input.style.top = '-1000px'

    return input
  }

  static dispatch(el: HTMLElement, eventName: string)
  {
    el.dispatchEvent(new MouseEvent(eventName, { bubbles: false, cancelable: true }))
  }

  static cleanup(input: HTMLElement)
  {
    if (input.parentNode) {
      input.parentNode.removeChild(input)
    }
  }

  /**
   * Open file dialog and return selected file
   */
  static async open(
    accept: string = 'video/*',
    multiple: boolean = false
  ): Promise<File | File[] | null> {
    return new Promise((resolve) => {
      const input = Filesystem.createInput({ accept, multiple })

      const cleanup = () => {
        Filesystem.cleanup(input)
        window.removeEventListener('focus', onFocus)
      }

      const onChange = () => {
        if (input.files && input.files.length > 0) {
          resolve(multiple ? Array.from(input.files) : input.files[0])
        } else {
          resolve(null)
        }

        cleanup()
      }

      const onCancel = () => {
        resolve(null)
        cleanup()
      }

      const onFocus = () => {
        setTimeout(() => {
          if (!input.files || input.files.length === 0) {
            onCancel()
          }
        }, 300)
      }

      window.addEventListener('focus', onFocus, { once: true })
      input.addEventListener('change', onChange)
      input.addEventListener('cancel', onCancel)

      document.body.appendChild(input)

      Filesystem.dispatch(input, 'click')
    })
  }

  /**
   * Wrapper for open() that uses a callback to avoid issues with async/await
   * in user gesture handlers.
   */
  static openWithCallback(
    callback: (result: File | File[] | null) => void,
    accept: string = 'video/*',
    multiple: boolean = false
  ): void {
    this.open(accept, multiple)
      .then(callback)
      .catch(error => {
        console.error('Error in file dialog:', error)
        callback(null)
      })
  }

  /**
   * Opens a file picker using the modern File System Access API.
   */
  static async selectFileWithPicker(
    accept: string = 'video/*',
    multiple: boolean = false
  ): Promise<File | File[] | null> {
    const options: FilePickerOptions = {
      types: [{
        description: 'Video Files',
        accept: { [accept]: ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'] }
      }],
      multiple
    }

    try {
      const mapper = (handle: FileSystemFileHandle) => handle.getFile()
      const handles = await showOpenFilePicker?.(options)

      return multiple ? Promise.all(handles.map(mapper)) : handles[0].getFile()
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return null
      }

      throw error
    }
  }

  /**
   * Create object URL from file (replacement for URL.createObjectURL)
   */
  static createObjectURL(file: File | Blob): string
  {
    return URL.createObjectURL(file)
  }

  /**
   * Revoke object URL
   */
  static revokeObjectURL(url: string): void
  {
    URL.revokeObjectURL(url)
  }

  /**
   * Check if file is a video
   */
  static isVideoFile(file: File): boolean
  {
    return file.type.startsWith('video/')
  }

  /**
   * Get file extension
   */
  static getFileExtension(filename: string): string
  {
    const parts = filename.split('.')

    return parts.length > 1
      ? parts[parts.length - 1].toLowerCase()
      : ''
  }

  /**
   * Format file size for display
   */
  static formatFileSize(
    bytes: number,
    decimals: number = 2,
    useBinary: boolean = false,
    locale: string = 'en-US'
  ): string {
    if (bytes === 0) return '0 B'

    // Use base 1024 (binary) or 1000 (decimal)
    const units = useBinary ? Filesystem.BINARY : Filesystem.DECIMAL
    const base = useBinary ? 1024 : 1000

    // Calculating the unit index
    const index = Math.floor(Math.log(bytes) / Math.log(base))
    const value = bytes / Math.pow(base, index)

    // Formatting a number with decimals precision, taking into account the locale
    const formatted = value.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })

    return `${formatted} ${units[index]}`
  }

  /**
   * Triggers a browser download for a given Blob.
   */
  static saveFile(blob: Blob, filename: string): void
  {
    const a = document.createElement('a')

    a.download = filename
    a.href = Filesystem.createObjectURL(blob)

    document.body.appendChild(a)

    Filesystem.dispatch(a, 'click')
    Filesystem.revokeObjectURL(a.href)
    Filesystem.cleanup(a)
  }
}
