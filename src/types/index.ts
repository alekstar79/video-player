/**
 * Core types and interfaces for the video player
 */

export type LoopMode = 'none' | 'one' | 'all';

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
  container: HTMLElement;
  autoPlay?: boolean;
  initialVolume?: number;
  playbackRate?: number;
  logging?: boolean;
  loopMode?: LoopMode;
  loop?: boolean;
  muted?: boolean;
  showControls: boolean;
  controlsVisibility?: ControlsVisibility;
  initialSources?: string[];
  maxWidth?: string | number; // '100%', 1200, '1200px'
  width?: string | number;    // '100%', 800, '800px'
  height?: string | number;   // '100%', 450, '450px'
  aspectRatio?: string;       // '16:9', '4:3', '21:9'
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
  url: string;
  title: string;
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
