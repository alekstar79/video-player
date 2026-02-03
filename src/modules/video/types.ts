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