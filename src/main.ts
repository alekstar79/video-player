import { VideoPlayerComponent, registerComponents } from './modules/ui/web-components'
import videos from '@/videos'
import './styles/main.scss'

const errorHandler = (error: Error | any) => {
  console.error('Failed to initialize video player:', error)

  const appElement = document.getElementById('app')
  if (appElement) {
    appElement.innerHTML = `
      <div style="color: red; text-align: center; padding: 20px;">
        <h2>Error Loading Video Player</h2>
        <p><strong>${error instanceof Error ? error.message : 'Unknown error'}</strong></p>
        <p>Please check the browser console for more details.</p>
        <p>Make sure you have a stable internet connection for loading icons and fonts.</p>
      </div>`
  }
}

const getVideoUrl = (filename: string) => new URL(`../public/${filename}`, import.meta.url).href

/**
 * Main application entry point
 * Initializes the video player when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const appElement = document.getElementById('app')
    if (!appElement) {
      errorHandler(new Error('App container element not found'))
      return
    }

    // Register all web components
    registerComponents()

    appElement.innerHTML = ''

    // Create video-player component
    const videoPlayer = document.createElement('video-player') as VideoPlayerComponent

    // Set configuration
    videoPlayer.initialSources = [
      ...videos.map(({ source }) => source),
      getVideoUrl('Synthwave.mp4'),
      getVideoUrl('GalaxyNebula.mp4')
    ]
    videoPlayer.maxWidth = '960px'
    videoPlayer.aspectRatio = '16:9'
    videoPlayer.loopMode = 'all'
    videoPlayer.muted = true
    videoPlayer.autoPlay = true
    videoPlayer.initialVolume = 0.7
    videoPlayer.playbackRate = 1.0
    videoPlayer.showControls = true
    videoPlayer.logging = false
    videoPlayer.controlsVisibility = {
      showOpenFile: true,
      showPlayPause: true,
      showSkipButtons: true,
      showVolume: true,
      showTimeDisplay: true,
      showSpeed: true,
      showPip: true,
      showFullscreen: true,
      showLoop: true,
      showTimeline: true
    }

    appElement.appendChild(videoPlayer)

    const player = await videoPlayer.whenReady()

    player.on('loopmodechanged', (mode) => {
      if (player.logging) {
        console.log('Loop mode changed to:', mode)
      }
    })

    if (player.logging) {
      console.log('Video Player initialized successfully')
    }

  } catch (error) {
    errorHandler(error as Error)
  }
})
