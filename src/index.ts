import { VideoPlayerComponent, registerComponents } from './modules/ui/web-components'
import { VideoPlayer } from './core/VideoPlayer'
import { VideoPlayerConfig } from './types'

export const defaultConfig: Partial<VideoPlayerConfig> = {
  initialSources: [],
  maxWidth: '960px',
  aspectRatio: '16:9',
  loopMode: 'none',
  autoPlay: false,
  muted: false,
  showControls: true,
  logging: false,
  initialVolume: 0.7,
  playbackRate: 1.0,
  controlsVisibility: {
    showFullscreen: true,
    showLoop: true,
    showOpenFile: true,
    showPip: true,
    showPlayPause: true,
    showSkipButtons: true,
    showSpeed: true,
    showTimeDisplay: true,
    showTimeline: true,
    showVolume: true
  }
}

export function createPlayer(
  container: HTMLElement,
  config?: Partial<VideoPlayerConfig>
): Promise<VideoPlayer> {
  registerComponents()

  const videoPlayer = document.createElement('video-player') as VideoPlayerComponent

  Object.assign(videoPlayer, defaultConfig, config)

  container.appendChild(videoPlayer)

  return videoPlayer.whenReady()
}

export {
  type VideoPlayerComponent,
  type VideoPlayerConfig,
  registerComponents
}
