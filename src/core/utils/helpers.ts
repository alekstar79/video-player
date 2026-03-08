/**
 * Utility functions for the video player
 */
export class Helpers
{
  /**
   * Format seconds into MM:SS or HH:MM:SS format for video duration
   */
  static formatTime(seconds: number): string
  {
    if (!isFinite(seconds) || seconds < 0) return '0:00'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    // Format seconds always as 2 digits
    const formattedSeconds = secs.toString().padStart(2, '0')

    if (hours > 0) {
      // Format as HH:MM:SS
      const formattedMinutes = minutes.toString().padStart(2, '0')
      return `${hours}:${formattedMinutes}:${formattedSeconds}`
    } else {
      // Format as MM:SS (no leading zero for minutes under 10)
      return `${minutes}:${formattedSeconds}`
    }
  }

  /**
   * Captures a frame from a video element and returns it as a Blob.
   */
  static captureFrame(video: HTMLVideoElement, quality: number = 0.8): Promise<Blob | null>
  {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return resolve(null)
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(resolve, 'image/jpeg', quality)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Clamp a value between min and max
   */
  static clamp(value: number, min: number, max: number): number
  {
    return Math.min(Math.max(value, min), max)
  }

  static parseBoolean(value: any): boolean
  {
    if (value === 'false') return false

    // Any other non-empty string or true will be considered true.
    return Boolean(value)
  }

  /**
   * Convert a string to camelCase, preserving the first letter's case.
   */
  static toCamelCase(str: string): string
  {
    return str.replace(/\s+(.)/g, (_, group) => group.toUpperCase())
  }

  /**
   * Check if a value is promises
   */
  static isPromiseLike<T extends any>(value: any): value is PromiseLike<T>
  {
    return value && (value as PromiseLike<T>).then !== undefined
  }

  /**
   * Check if a URL is cross-origin
   */
  static isCrossOrigin(url: string): boolean
  {
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return false
    }

    const a = document.createElement('a')
    a.href = url

    return a.origin !== window.location.origin
  }

  /**
   * Debounce function
   */
  static debounce<F extends (...args: any[]) => any>(
    func: F, ms: number,
  ): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> {
    let timeoutId: ReturnType<typeof setTimeout>

    return (...args: Parameters<F>): Promise<Awaited<ReturnType<F>>> => {
      clearTimeout(timeoutId)

      return new Promise(resolve => {
        timeoutId = setTimeout(async () => {
          resolve(await func(...args))
        }, ms)
      })
    }
  }
}
