import { EventEmitter } from '@/core/events/EventEmitter'
import { FullscreenController } from '@/modules/controls/FullscreenController'
import { PlaybackController } from '@/modules/controls/PlaybackController'
import { TimelineController } from '@/modules/controls/TimelineController'
import { VideoController } from '@/modules/controls/VideoController'
import { VolumeController } from '@/modules/controls/VolumeController'

import {
  FullscreenButtonComponent,
  LoopButtonComponent,
  PipButtonComponent,
  PlaylistButtonComponent,
  PlayPauseButtonComponent,
  PreviewButtonComponent,
  TimeDisplayComponent,
  VolumeControlComponent,
} from '@/modules/ui/web-components'

/**
 * Core types and interfaces for the video player
 */

export type LoopMode = 'none' | 'one' | 'all'

export interface ControlsVisibility {
  showOpenFile?: boolean;
  showPlayPause?: boolean;
  showSkipButtons?: boolean;
  showVolume?: boolean;
  showTimeDisplay?: boolean;
  showSpeed?: boolean;
  showPip?: boolean;
  showFullscreen?: boolean;
  showLoop?: boolean;
  showTimeline?: boolean;
}

export interface VideoPlayerConfig {
  initialSources?: (string | Partial<VideoSource>)[];
  container: HTMLElement;
  autoPlay?: boolean;
  initialVolume?: number;
  playbackRate?: number;
  logging?: boolean;
  loopMode?: LoopMode;
  muted?: boolean;
  showControls: boolean;
  controlsVisibility?: ControlsVisibility;
  maxWidth?: string | number; // '100%', 1200, '1200px'
  width?: string | number;    // '100%', 800, '800px'
  height?: string | number;   // '100%', 450, '450px'
  aspectRatio?: string;       // '16:9', '4:3', '21:9'
  nextButton?: boolean;
  prevButton?: boolean;
}

export interface TimeUpdateEvent {
  currentTime: number;
  duration: number;
  progress: number;
  formattedCurrent: string;
  formattedDuration: string;
}

export interface VolumeChangeEvent {
  volume: number;
  muted: boolean;
}

export interface PlaybackRateEvent {
  playbackRate: number;
}

export type PlayerEventMap = {
  'play': void;
  'pause': void;
  'ended': void;
  'timeupdate': TimeUpdateEvent;
  'volumechange': VolumeChangeEvent;
  'playbackratechange': PlaybackRateEvent;
  'fullscreenchange': boolean;
  'loadedmetadata': void;
  'error': Error;
  'sourcechanged': number;
  'loopmodechanged': LoopMode;
  'mounted': void;
  'context': any
}

/**
 * Video-specific types and interfaces
 */

export interface VideoElement extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  msRequestFullscreen?: () => void;
  mozRequestFullScreen?: () => void;
}

export interface VideoEventHandlers {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onVolumeChange: (volume: number, muted: boolean) => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onLoadedMetadata: () => void;
  onError: (error: Error) => void;
}

export interface VideoControls {
  play(): Promise<void>;
  pause(): void;
  setCurrentTime(time: number): void;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  toggleMute(): void;
  skip(seconds: number): void;
}

export interface VideoSource {
  title: string;
  url: string;
  description?: string;
  thumb?: string;
  file?: File;
}

export interface CustomChangeCallback {
  (value: boolean, ev: Event): void
}

export interface BoundingEventHandler {
  (ev: Event): void
}

export interface FullscreenMethodMapping {
  request: string;
  exit: string;
  element: string;
  enabled: string;
  change: string;
  error: string;
}

export interface FullscreenHandler {
  readonly isFullscreen: boolean;
  readonly isEnabled: boolean;
  readonly element: Element | null;
  readonly requestMethod: string;
  readonly exitMethod: string;

  request(element?: Element, options?: FullscreenOptions): Promise<boolean>;
  exit(): Promise<boolean>;
  toggle(element?: Element, options?: FullscreenOptions): Promise<boolean>;
  on(event: 'change' | 'error', callback: (event: Event) => void): void;
  off(event: 'change' | 'error', callback: (event: Event) => void): void;
  onchange(callback: (event: Event) => void): void;
  onerror(callback: (event: Event) => void): void;
}

export interface ZIndexInterface {
  value(uid: string): string;
  push(uid: string): this;
  remove(uid: string): this;
  sort(uid: string): this;
}

export interface VideoPlayerInterface {
  events: EventEmitter<PlayerEventMap>;
  playerElement: Element | PromiseLike<HTMLElement> | null
  root: Document | ShadowRoot;
  container: HTMLElement;
  config: VideoPlayerConfig;
  controlsVisibility: Required<ControlsVisibility>;
  isShowControls: boolean;
  videoController: VideoController
  volumeController: VolumeController
  playbackController: PlaybackController
  fullscreenController: FullscreenController
  timelineController: TimelineController
  playPauseButton: PlayPauseButtonComponent
  loopButton: LoopButtonComponent
  fullscreenButton: FullscreenButtonComponent
  pipButton: PipButtonComponent
  timeDisplay: TimeDisplayComponent
  playlistButton: PlaylistButtonComponent
  playlistPanel: HTMLElement
  previewButton: PreviewButtonComponent
  previewPanel: HTMLElement
  volumeControl: VolumeControlComponent
  sourceTitleElement: HTMLElement
  noFilesMessage: HTMLElement
  zIndex: ZIndexInterface;
  draggablePanels: HTMLElement[];
  resizeHandlers: Map<string, () => void>;
  sources: VideoSource[];
  currentSourceIndex: number;
  interfaceTimeout: string | number | NodeJS.Timeout | undefined
  titleTimeout: string | number | NodeJS.Timeout | undefined
  isMouseOverControls: boolean;
  sourcePrevButton: HTMLElement
  sourceNextButton: HTMLElement
  loopMode: LoopMode;
  logging: boolean;

  normalizeSources(sources: (string | Partial<VideoSource>)[]): VideoSource[];

  initializeControlsVisibility(): void;
  initializePlayer(): Promise<void>;

  toggleNoFilesMessage(show: boolean): void;

  applyContainerSizes(): void;
  awaitLayout(selector: string, ms: number): Promise<void>;
  applyAspectRatio(ratio: string): void;

  applyIndividualControlsVisibility(): void;

  loadInitialSources(): Promise<void>;

  tryNextSource(): Promise<void>;

  loadSourceByIndex(index: number, playAfterLoad?: boolean): Promise<void>;

  highlightSourceNavigation(): void;

  hideAllControls(): void;

  showAllControls(): void;

  initializeDraggablePanels(): void;
  initializeControllers(): void;
  initInterfaceAutoHide(): void;

  checkPictureInPictureSupport(): { supported: boolean; reason?: string };

  bindEventListeners(): void;

  bindKeyboardEvents(): void;

  initializePiPListeners(): void;


  handleEnterPiP(): void;
  handleLeavePiP(): void;

  resetInterfaceTimeout(): void;

  handleResize(): void;

  updateSourceNavigationVisibility(): void;

  handleTimeUpdate(currentTime: number, duration: number): void;

  handleVolumeChange(volume: number, muted: boolean): void;

  handlePlay(): void;
  handlePause(): void;

  handleEnded(): void;

  handleLoadedMetadata(): void;

  handleError(error: Error): void;

  handleFullscreenChange(isFullscreen: boolean): void;

  adjustSourceNavigationPosition(): void;

  applyLoopMode(): void;
  updateLoopButton(): void;

  showControl(control: keyof ControlsVisibility): void;
  hideControl(control: keyof ControlsVisibility): void;
  toggleControl(control: keyof ControlsVisibility): void;

  getControlVisibility(control: keyof ControlsVisibility): boolean;

  addSource(source: Partial<VideoSource>): void;
  getSources(): VideoSource[];
  setSources(sources: (string | Partial<VideoSource>)[]): void;
  getCurrentSource(): VideoSource | undefined;
  getCurrentSourceIndex(): number;
  nextSource(): Promise<void>;
  previousSource(): Promise<void>;

  setControlsVisibility(visibility: Partial<ControlsVisibility>): void;

  switchToSource(index: number): Promise<void>;
  switchToSourceByUrl(url: string): Promise<void>;

  setSource(src: string, muted: boolean): void;

  loadVideoFile(): Promise<void>;
  loadVideoFromUrl(url: string): Promise<void>;

  play(): Promise<void>;
  pause(): void;

  togglePlay(): Promise<void>;
  toggleFullscreen(): Promise<void>;
  togglePictureInPicture(): Promise<void>;

  isPictureInPictureSupported(): boolean;

  showControls(): void;
  hideControls(): void;
  toggleControls(): void;

  getControlsVisible(): boolean;

  setVolume(volume: number): void;
  setMuted(muted: boolean): void;

  setPlaybackRate(rate: number): void;

  getLoop(): boolean;
  setLoop(loop: boolean): void;

  toggleLoop(): void;
  getLoopMode(): LoopMode;
  setLoopMode(mode: LoopMode): void;

  skip(seconds: number): void;
  seekTo(time: number): void;

  getCurrentTime(): number;

  getDuration(): number;

  getVolume(): number;
  getIsMuted(): boolean;

  getIsPlaying(): boolean;

  getPlaybackRate(): number;

  on<K extends keyof PlayerEventMap>(event: K, callback: (data: PlayerEventMap[K] | undefined) => void): void;
  off<K extends keyof PlayerEventMap>(event: K, callback: (data: PlayerEventMap[K] | undefined) => void): void;

  showInterface(): void;
  hideInterface(): void;

  isPlayerActive(): boolean;

  updatePlaylist(): void;

  togglePlaylist(): void;
  togglePreviewPanel(): Promise<void>;

  handleFileLoaded(file: File, url: string): Promise<void>;

  generateAndShowPreview(): Promise<void>;

  showSourceTitle(): void;

  handlePanelFocus(panelId: string): void;

  adjustPanelsToViewport(): void;
  adjustVolumeOrientation(): void;

  destroy(): void;
}
