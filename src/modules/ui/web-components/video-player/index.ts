import type { ControlsVisibility, LoopMode } from '@/core/types'

import { BaseComponent } from '../BaseComponent'
import { VideoPlayer } from '@/app/VideoPlayer'
import styles from './style.scss?raw'

const template = `
  <div class="player">
    <em class="fas fa-pause player__main-icon j-pause"></em>
    <em class="fas fa-play player__main-icon j-play"></em>

    <video class="player__video"></video>

    <button class="player__source-nav player__source-nav--prev j-source-prev" title="Previous source">
      <em class="fas fa-chevron-left fa-lg"></em>
    </button>
    <button class="player__source-nav player__source-nav--next j-source-next" title="Next source">
      <em class="fas fa-chevron-right fa-lg"></em>
    </button>

    <div class="player__panel">
      <timeline-control></timeline-control>

      <div class="player__panel-block">
        <skip-button direction="backward" seconds="5"></skip-button>
        <button class="player__panel-button j-open-file" title="Open video file">
          <em class="fas fa-folder-open"></em>
        </button>
        <loop-button></loop-button>
        <play-pause-button></play-pause-button>
        <skip-button direction="forward" seconds="5"></skip-button>
        <volume-control></volume-control>
        <time-display></time-display>
      </div>

      <div class="player__panel-block">
        <speed-options></speed-options>
        <pip-button></pip-button>
        <fullscreen-button></fullscreen-button>
      </div>
    </div>
  </div>
`

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
      container: this.shadow as unknown as HTMLElement,
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
    })

    this.resolveReady(this.playerInstance)
  }

  public whenReady(): Promise<VideoPlayer>
  {
    return this.readyPromise
  }
}
