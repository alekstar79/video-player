import FullscreenButtonComponent from './fullscreen-button'
import LoopButtonComponent from './loop-button'
import PipButtonComponent from './pip-button'
import PlayPauseButtonComponent from './play-pause-button'
import SkipButtonComponent from './skip-button'
import SpeedOptionsComponent from './speed-options'
import TimeDisplayComponent from './time-display'
import TimelineComponent from './timeline'
import VolumeControlComponent from './volume-control'
import VideoPlayerComponent from './video-player'

export function registerComponents() {
  customElements.define('fullscreen-button', FullscreenButtonComponent)
  customElements.define('loop-button', LoopButtonComponent)
  customElements.define('pip-button', PipButtonComponent)
  customElements.define('play-pause-button', PlayPauseButtonComponent)
  customElements.define('skip-button', SkipButtonComponent)
  customElements.define('speed-options', SpeedOptionsComponent)
  customElements.define('time-display', TimeDisplayComponent)
  customElements.define('timeline-control', TimelineComponent)
  customElements.define('volume-control', VolumeControlComponent)
  customElements.define('video-player', VideoPlayerComponent)
}

export function whenDefined(): Promise<CustomElementConstructor[]> {
  return Promise.all([
    customElements.whenDefined('volume-control'),
    customElements.whenDefined('timeline-control'),
    customElements.whenDefined('time-display'),
    customElements.whenDefined('speed-options'),
    customElements.whenDefined('play-pause-button'),
    customElements.whenDefined('skip-button'),
    customElements.whenDefined('loop-button'),
    customElements.whenDefined('fullscreen-button'),
    customElements.whenDefined('pip-button'),
  ])
}

export type {
  FullscreenButtonComponent,
  LoopButtonComponent,
  PlayPauseButtonComponent,
  PipButtonComponent,
  SkipButtonComponent,
  SpeedOptionsComponent,
  TimeDisplayComponent,
  TimelineComponent,
  VolumeControlComponent,
  VideoPlayerComponent,
}
