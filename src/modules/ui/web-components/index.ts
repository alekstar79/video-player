import FullscreenButtonComponent from './fullscreen-button'
import LoopButtonComponent from './loop-button'
import OpenFileButtonComponent from './open-file-button'
import PipButtonComponent from './pip-button'
import PlayPauseButtonComponent from './play-pause-button'
import PlaylistButtonComponent from './playlist-button'
import PlaylistPanelComponent from './playlist-panel'
import PreviewButtonComponent from './preview-button'
import PreviewPanelComponent from './preview-panel'
import SkipButtonComponent from './skip-button'
import SpeedOptionsComponent from './speed-options'
import TimeDisplayComponent from './time-display'
import TimelineComponent from './timeline'
import VolumeControlComponent from './volume-control'
import VideoPlayerComponent from './video-player'

export function registerComponents() {
  customElements.define('fullscreen-button', FullscreenButtonComponent)
  customElements.define('loop-button', LoopButtonComponent)
  customElements.define('open-file-button', OpenFileButtonComponent)
  customElements.define('pip-button', PipButtonComponent)
  customElements.define('play-pause-button', PlayPauseButtonComponent)
  customElements.define('playlist-button', PlaylistButtonComponent)
  customElements.define('playlist-panel', PlaylistPanelComponent)
  customElements.define('preview-button', PreviewButtonComponent)
  customElements.define('preview-panel', PreviewPanelComponent)
  customElements.define('skip-button', SkipButtonComponent)
  customElements.define('speed-options', SpeedOptionsComponent)
  customElements.define('time-display', TimeDisplayComponent)
  customElements.define('timeline-control', TimelineComponent)
  customElements.define('volume-control', VolumeControlComponent)
  customElements.define('video-player', VideoPlayerComponent)
}

export function whenDefined(): Promise<CustomElementConstructor[]> {
  return Promise.all([
    customElements.whenDefined('fullscreen-button'),
    customElements.whenDefined('loop-button'),
    customElements.whenDefined('open-file-button'),
    customElements.whenDefined('pip-button'),
    customElements.whenDefined('play-pause-button'),
    customElements.whenDefined('playlist-button'),
    customElements.whenDefined('playlist-panel'),
    customElements.whenDefined('preview-button'),
    customElements.whenDefined('preview-panel'),
    customElements.whenDefined('skip-button'),
    customElements.whenDefined('speed-options'),
    customElements.whenDefined('timeline-control'),
    customElements.whenDefined('time-display'),
    customElements.whenDefined('volume-control'),
    customElements.whenDefined('video-player')
  ])
}

export type {
  FullscreenButtonComponent,
  LoopButtonComponent,
  OpenFileButtonComponent,
  PlayPauseButtonComponent,
  PipButtonComponent,
  PlaylistButtonComponent,
  PlaylistPanelComponent,
  PreviewButtonComponent,
  PreviewPanelComponent,
  SkipButtonComponent,
  SpeedOptionsComponent,
  TimeDisplayComponent,
  TimelineComponent,
  VolumeControlComponent,
  VideoPlayerComponent,
}
