/**
 * Utility for opening file dialog - replacement for old utils.js open function
 */
export class Filesystem
{
  static BINARY = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  static DECIMAL = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

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

  static cleanup(input: HTMLElement)
  {
    document.body.removeChild(input)
  }

  /**
   * Open file dialog and return selected file
   */
  static async open(accept: string = '*/*', multiple: boolean = false): Promise<File | File[] | null>
  {
    return new Promise((resolve) => {
      const input = Filesystem.createInput({ accept, multiple })

      input.addEventListener('change', () => {
        if (input.files && input.files.length > 0) {
          if (multiple) {
            resolve(Array.from(input.files))
          } else {
            resolve(input.files[0])
          }
        } else {
          resolve(null)
        }

        Filesystem.cleanup(input)
      })

      input.addEventListener('cancel', () => {
        resolve(null)
        Filesystem.cleanup(input)
      })

      document.body.appendChild(input)
      input.click()
    })
  }

  /**
   * Wrapper for open() that uses a callback to avoid issues with async/await
   * in user gesture handlers.
   */
  static openWithCallback(
    callback: (result: File | File[] | null) => void,
    accept: string = '*/*',
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
    return filename.split('.').pop()?.toLowerCase() || ''
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
    a.click()

    Filesystem.revokeObjectURL(a.href)
    Filesystem.cleanup(a)
  }
}
