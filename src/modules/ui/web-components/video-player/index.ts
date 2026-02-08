import type { ControlsVisibility, LoopMode, VideoPlayerConfig, VideoSource } from '@/types'

import { BaseComponent } from '../BaseComponent'
import { VideoPlayer } from '@/core/VideoPlayer'

import template from './template.html?raw'
import styles from './style.scss?inline'

interface AttributeMap {
  [key: string]: {
    configKey: keyof VideoPlayerConfig | keyof ControlsVisibility,
    isControl: boolean
  }
}

export default class VideoPlayerComponent extends BaseComponent
{
  private playerInstance?: VideoPlayer
  private readyPromise?: Promise<VideoPlayer>

  // Properties to accept configuration
  public initialSources: (string | Partial<VideoSource>)[] = []
  public maxWidth!: string | number
  public aspectRatio!: string
  public loopMode!: LoopMode
  public muted!: boolean
  public autoPlay!: boolean
  public initialVolume!: number
  public playbackRate!: number
  public showControls!: boolean
  public logging!: boolean
  public controlsVisibility!: Partial<ControlsVisibility>
  public nextButton!: boolean
  public prevButton!: boolean

  constructor()
  {
    super()
    this.render(template, styles)
  }

  connectedCallback()
  {
    this.whenReady().catch(console.error)
  }

  private parseAttribute(name: string, value: string | null): any
  {
    const booleanAttributes = [
      'show-controls', 'show-fullscreen', 'show-loop', 'show-openfile', 'show-open-file',
      'show-pip', 'show-playpause', 'show-play-pause', 'show-skipbuttons', 'show-skip-buttons',
      'show-speed', 'show-timedisplay', 'show-time-display', 'show-timeline', 'show-volume',
      'auto-play', 'muted', 'logging', 'next-button', 'prev-button'
    ]

    if (booleanAttributes.includes(name)) {
      return value !== 'false'
    }

    if (name === 'initial-sources' && value) {
      try {
        // Use Function constructor to parse JavaScript literal. It's safer than eval.
        return new Function(`return ${value}`)()
      } catch (e) {
        console.error(`Error parsing initial-sources attribute: "${value}"`, e)
        return []
      }
    }

    if (value === null) return undefined

    const floatValue = parseFloat(value)
    if (!isNaN(floatValue) && name !== 'aspect-ratio') {
      return floatValue
    }

    return value
  }

  public whenReady(): Promise<VideoPlayer>
  {
    return (this.readyPromise ??= new Promise(
      (resolve) => {
        // Defer initialization to ensure all properties are set
        setTimeout(() => {
          const attributeMap: AttributeMap = {
            // adjustment attributes
            'initial-sources': { configKey: 'initialSources', isControl: false },
            'aspect-ratio': { configKey: 'aspectRatio', isControl: false },
            'max-width': { configKey: 'maxWidth', isControl: false },
            'loop-mode': { configKey: 'loopMode', isControl: false },
            'auto-play': { configKey: 'autoPlay', isControl: false },
            'muted': { configKey: 'muted', isControl: false },
            'logging': { configKey: 'logging', isControl: false },
            'initial-volume': { configKey: 'initialVolume', isControl: false },
            'playback-rate': { configKey: 'playbackRate', isControl: false },
            'show-controls': { configKey: 'showControls', isControl: false },
            'next-button': { configKey: 'nextButton', isControl: false },
            'prev-button': { configKey: 'prevButton', isControl: false },
            // controls
            'show-fullscreen': { configKey: 'showFullscreen', isControl: true },
            'show-loop': { configKey: 'showLoop', isControl: true },
            'show-openfile': { configKey: 'showOpenFile', isControl: true },
            'show-open-file': { configKey: 'showOpenFile', isControl: true }, // Alias
            'show-pip': { configKey: 'showPip', isControl: true },
            'show-playpause': { configKey: 'showPlayPause', isControl: true },
            'show-play-pause': { configKey: 'showPlayPause', isControl: true }, // Alias
            'show-skipbuttons': { configKey: 'showSkipButtons', isControl: true },
            'show-skip-buttons': { configKey: 'showSkipButtons', isControl: true }, // Alias
            'show-speed': { configKey: 'showSpeed', isControl: true },
            'show-timedisplay': { configKey: 'showTimeDisplay', isControl: true },
            'show-time-display': { configKey: 'showTimeDisplay', isControl: true }, // Alias
            'show-timeline': { configKey: 'showTimeline', isControl: true },
            'show-volume': { configKey: 'showVolume', isControl: true },
          }

          const parsedConfig: Partial<VideoPlayerConfig> = {}
          const controlsVisibility: Partial<ControlsVisibility> = {}

          for (const attr of this.attributes) {
            const { name, value } = attr // name is always lowercase
            const mapping = attributeMap[name]

            if (mapping) {
              const parsedValue = this.parseAttribute(name, value)
              if (mapping.isControl) {
                (controlsVisibility as any)[mapping.configKey] = parsedValue
              } else {
                (parsedConfig as any)[mapping.configKey] = parsedValue
              }
            }
          }

          const config: VideoPlayerConfig = {
            container: this,
            ...parsedConfig,
            showControls: parsedConfig.showControls ?? true,
            controlsVisibility
          }

          this.playerInstance ??= new VideoPlayer(config, this.shadow)

          resolve(this.playerInstance)
        })
      }
    ))
  }
}
