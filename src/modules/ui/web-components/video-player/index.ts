import type { ControlsVisibility, LoopMode, VideoSource } from '@/types'

import { BaseComponent } from '../BaseComponent'
import { VideoPlayer } from '@/app/VideoPlayer'

import template from './template.html?raw'
import styles from './style.scss?inline'

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

  constructor()
  {
    super()
    this.render(template, styles)
  }

  public whenReady(): Promise<VideoPlayer>
  {
    return (this.readyPromise ??= new Promise(
      (resolve) => {
        // Defer initialization to ensure all properties are set
        setTimeout(() => {
          this.playerInstance ??= new VideoPlayer({
            container: this,
            initialSources: this.initialSources,
            maxWidth: this.maxWidth,
            aspectRatio: this.aspectRatio,
            loopMode: this.loopMode,
            muted: this.muted,
            autoPlay: this.autoPlay,
            initialVolume: this.initialVolume,
            playbackRate: this.playbackRate,
            showControls: this.showControls,
            logging: this.logging,
            controlsVisibility: this.controlsVisibility,
          }, this.shadow)

          resolve(this.playerInstance)
        })
      }
    ))
  }
}
