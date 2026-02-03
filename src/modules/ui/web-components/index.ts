import VideoPlayerComponent from './video-player'
import VolumeControlComponent from './volume-control'
import TimelineComponent from './timeline'
import TimeDisplayComponent from './time-display'
import SpeedOptionsComponent from './speed-options'
import PlayPauseButtonComponent from './play-pause-button'
import SkipButtonComponent from './skip-button'
import LoopButtonComponent from './loop-button'
import FullscreenButtonComponent from './fullscreen-button'
import PipButtonComponent from './pip-button'

customElements.define('video-player', VideoPlayerComponent)
customElements.define('volume-control', VolumeControlComponent)
customElements.define('timeline-control', TimelineComponent)
customElements.define('time-display', TimeDisplayComponent)
customElements.define('speed-options', SpeedOptionsComponent)
customElements.define('play-pause-button', PlayPauseButtonComponent)
customElements.define('skip-button', SkipButtonComponent)
customElements.define('loop-button', LoopButtonComponent)
customElements.define('fullscreen-button', FullscreenButtonComponent)
customElements.define('pip-button', PipButtonComponent)

export function waitForElements(): Promise<CustomElementConstructor[]>
{
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

export {
  VideoPlayerComponent,
  VolumeControlComponent,
  TimelineComponent,
  TimeDisplayComponent,
  SpeedOptionsComponent,
  PlayPauseButtonComponent,
  SkipButtonComponent,
  LoopButtonComponent,
  FullscreenButtonComponent,
  PipButtonComponent,
}
