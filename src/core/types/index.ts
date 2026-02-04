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
