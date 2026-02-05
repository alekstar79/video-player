/**
 * Describes the technical metadata of a video.
 */
export interface ITechnicalMetadata {
  width: number;
  height: number;
  duration: number;
}

/**
 * Options for generating thumbnails.
 */
export interface IThumbnailGenOptions {
  quality?: number;
  interval?: number;
  scale?: number;
  start: number;
  end?: number;
}

/**
 * Describes the generated thumbnail.
 */
export interface IThumbnail {
  blob: Blob | null;
  currentTime: number;
}

/**
 * A class for extracting technical metadata and generating thumbnails from videos
 */
export class ThumbnailGenerator
{
  private readonly videoElement: HTMLVideoElement
  private canvas: HTMLCanvasElement
  private canvasContext: CanvasRenderingContext2D

  constructor(blob: string | Blob)
  {
    if (!blob) throw new Error('Video source is required.')

    this.videoElement = document.createElement('video')
    this.videoElement.preload = 'metadata'
    this.videoElement.muted = true
    this.videoElement.crossOrigin = 'anonymous'

    this.canvas = document.createElement('canvas')
    this.canvasContext = this.canvas.getContext('2d')!

    const URL = window.URL || window.webkitURL
    const src = typeof blob === 'string' ? blob : URL.createObjectURL(blob)
    this.videoElement.src = src

    this.videoElement.addEventListener('ended', () => {
      if (typeof blob !== 'string') {
        URL.revokeObjectURL(src)
      }
    }, { once: true })
  }

  /**
   * Gets the technical metadata of the video.
   */
  public getTechnicalMetadata(): Promise<ITechnicalMetadata>
  {
    return new Promise((resolve, reject) => {
      this.videoElement.addEventListener('loadedmetadata', () => {
        const { videoWidth, videoHeight, duration } = this.videoElement

        if (duration === Infinity) {
          this.videoElement.currentTime = 1e101 // Trying to go to the end
          this.videoElement.addEventListener('timeupdate', () => {
            this.videoElement.currentTime = 0 // Reset

            resolve({
              width: videoWidth,
              height: videoHeight,
              duration: this.videoElement.duration,
            })
          }, { once: true })
        } else {
          resolve({ width: videoWidth, height: videoHeight, duration })
        }
      }, { once: true })

      this.videoElement.addEventListener('error', () => {
        reject(new Error('Failed to load video for metadata extraction.'))
      }, { once: true })
    })
  }

  /**
   * Generates a series of frames from a video.
   */
  public getThumbnails(option: IThumbnailGenOptions): Promise<IThumbnail[]>
  {
    const thumbnails: IThumbnail[] = []
    let count = 0

    const defaultOption: IThumbnailGenOptions = {
      quality: 0.7,
      interval: 1,
      scale: 0.7,
      start: 0,
    }

    const options = { ...defaultOption, ...option }

    return new Promise((resolve, reject) => {
      const seekHandler = () => {
        this.generateFrame(options, thumbnails, count)
          .then(isFinished => {
            if (isFinished) {
              this.videoElement.removeEventListener('seeked', seekHandler, false)
              resolve(thumbnails)
            } else {
              count++
              this.videoElement.currentTime += options.interval!
            }
          })
          .catch(reject)
      }

      this.videoElement.addEventListener('loadeddata', () => {
        this.videoElement.addEventListener('seeked', seekHandler)
        this.videoElement.currentTime = options.start
      }, { once: true })

      this.videoElement.addEventListener('error', (err) => {
        reject(new Error(`Failed to load video for thumbnail generation: ${err}`))
      }, { once: true })
    })
  }

  /**
   * Creates a single frame (thumbnail)
   */
  private generateFrame(
    options: IThumbnailGenOptions,
    thumbnails: IThumbnail[],
    count: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const { videoWidth, videoHeight, duration, currentTime } = this.videoElement
        const { quality, interval, start, end, scale } = options

        const isEnded = currentTime >= (end ?? duration)
        if (isEnded) {
          return resolve(true)
        }

        const targetWidth = videoWidth * (scale || 1)
        const targetHeight = videoHeight * (scale || 1)

        this.canvas.width = targetWidth
        this.canvas.height = targetHeight
        this.canvasContext.drawImage(this.videoElement, 0, 0, targetWidth, targetHeight)

        this.canvas.toBlob(
          (blob) => {
            thumbnails.push({
              currentTime: start! + interval! * count,
              blob
            })
            resolve(false)
          },
          'image/jpeg',
          quality
        )
      } catch (error) {
        reject(error)
      }
    })
  }
}
