import type { ControlsVisibility, LoopMode, VideoPlayerConfig, VideoSource } from '@/types'

import { BaseComponent } from '../BaseComponent'
import { VideoPlayer } from '@/core/VideoPlayer'

import template from './template.html?raw'
import styles from './style.scss?inline'

import { createContextMenu, styles as menu } from './context-menu'

interface AttributeMap {
  [key: string]: {
    configKey: keyof VideoPlayerConfig | keyof ControlsVisibility,
    isControl: boolean
  }
}

export default class VideoPlayerComponent extends BaseComponent
{
  private readyPromise!: Promise<VideoPlayer>
  private playerInstance!: VideoPlayer

  // Properties to accept configuration
  public initialSources: (string | Partial<VideoSource>)[] = []
  public maxWidth!: string | number
  public aspectRatio!: string
  public loopMode!: LoopMode
  public muted!: boolean
  public autoPlay!: boolean
  public initialVolume!: number
  public playbackRate!: number
  public showControls: boolean = true
  public controlsVisibility: Partial<ControlsVisibility> = {}
  public nextButton!: boolean
  public prevButton!: boolean
  public logging!: boolean

  constructor()
  {
    super()
    this.render(template, `${styles}\n${menu}`)
  }

  connectedCallback()
  {
    this.whenReady().then(createContextMenu)
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
        // Start with programmatically set properties as the base
        const baseConfig: Partial<VideoPlayerConfig> = {
          initialSources: this.initialSources,
          maxWidth: this.maxWidth,
          aspectRatio: this.aspectRatio,
          loopMode: this.loopMode,
          muted: this.muted,
          autoPlay: this.autoPlay,
          initialVolume: this.initialVolume,
          playbackRate: this.playbackRate,
          showControls: this.showControls,
          nextButton: this.nextButton,
          prevButton: this.prevButton,
          logging: this.logging
        }

        const baseControlsVisibility = this.controlsVisibility || {}

        // Parse attributes and create a config from them
        const attrConfig: Partial<VideoPlayerConfig> = {}
        const attrControlsVisibility: Partial<ControlsVisibility> = {}

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
          'show-volume': { configKey: 'showVolume', isControl: true }
        }

        for (const attr of this.attributes) {
          const { name, value } = attr;
          const mapping = attributeMap[name]

          if (mapping) {
            const parsedValue = this.parseAttribute(name, value)

            if (mapping.isControl) {
              (attrControlsVisibility as any)[mapping.configKey] = parsedValue
            } else {
              (attrConfig as any)[mapping.configKey] = parsedValue
            }
          }
        }

        // Merge configs: attributes override programmatic properties
        const finalConfig: VideoPlayerConfig = {
          container: this,
          ...baseConfig,
          ...attrConfig,
          showControls: attrConfig.showControls ?? baseConfig.showControls ?? true,
          controlsVisibility: {
            ...baseControlsVisibility,
            ...attrControlsVisibility
          }
        }

        this.playerInstance ??= new VideoPlayer(finalConfig, this.shadow)
        this.playerInstance.on('mounted', () => {
          resolve(this.playerInstance)
        })
      }
    ))
  }
}
