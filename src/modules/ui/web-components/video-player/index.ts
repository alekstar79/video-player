import type { ControlsVisibility, LoopMode } from '@/core/types'

import { BaseComponent } from '../BaseComponent'
import { VideoPlayer } from '@/app/VideoPlayer'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class VideoPlayerComponent extends BaseComponent
{
  private resolveReady!: (player: VideoPlayer) => void
  private readonly readyPromise: Promise<VideoPlayer>
  private playerInstance!: VideoPlayer

  // Properties to accept configuration
  public initialSources: string[] = []
  public maxWidth!: string | number
  public aspectRatio!: string
  public loop!: boolean
  public loopMode!: LoopMode
  public muted!: boolean
  public autoPlay!: boolean
  public initialVolume!: number
  public playbackRate!: number
  public showControls!: boolean
  public logging!: boolean
  public controlsVisibility!: Partial<ControlsVisibility>

  constructor()
  {
    super()
    this.readyPromise = new Promise(resolve => {
      this.resolveReady = resolve
    })

    this.render(template, styles)
  }

  connectedCallback()
  {
    // Now the properties are available
    this.playerInstance = new VideoPlayer({
      container: this, // The host element itself is the container for styles
      initialSources: this.initialSources,
      maxWidth: this.maxWidth,
      aspectRatio: this.aspectRatio,
      loop: this.loop,
      loopMode: this.loopMode,
      muted: this.muted,
      autoPlay: this.autoPlay,
      initialVolume: this.initialVolume,
      playbackRate: this.playbackRate,
      showControls: this.showControls,
      logging: this.logging,
      controlsVisibility: this.controlsVisibility,
    }, this.shadow) // The shadow root is for querying elements

    this.resolveReady(this.playerInstance)
  }

  public whenReady(): Promise<VideoPlayer>
  {
    return this.readyPromise
  }
}
