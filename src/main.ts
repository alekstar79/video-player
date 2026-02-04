import type { VideoPlayer } from './app/VideoPlayer'

import { VideoPlayerComponent, registerComponents } from './modules/ui/web-components'

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

// Updating information about sources
function updateSourceInfo(player: VideoPlayer): (el: HTMLElement) => void {
  return (el: HTMLElement) => {
    const sources = player.getSources()
    const currentIndex = player.getCurrentSourceIndex()
    const list = sources.map((src, idx) =>
      `<li class="playlist-item" style="cursor: pointer;" data-src="${src}">${idx === currentIndex ? '▶ ' : ''}${src.split('/').pop() || src}</li>`
    )

    el.innerHTML = `
<strong>Playlist (${currentIndex + 1}/${sources.length}):</strong><br>
<ul class="playlist" style="list-style: none">
  ${list.join('')}
</ul> `

    el.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'LI') {
        console.log(target.dataset.src)
      }
    })
  }
}

function createDemoDashboardInfo(player: VideoPlayer): HTMLElement {
  const changeSourceHandler = updateSourceInfo(player)
  const sourceInfo = document.createElement('div')

  sourceInfo.style.cssText = `
    max-width: 150px;
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    font-size: 12px;
    background: white;`

  changeSourceHandler(sourceInfo)
  player.on('sourcechanged', () => {
    changeSourceHandler(sourceInfo)
  })

  return sourceInfo
}

// Create controls toggle button
function createDemoControlsToggle(player: VideoPlayer): HTMLElement
{
  const getButtonTitle = () => player.getControlsVisible() ? 'Hide Controls' : 'Show Controls'
  const controlsToggle = document.createElement('button')
  controlsToggle.textContent = getButtonTitle()
  controlsToggle.style.cssText = `
    min-width: 120px;
    z-index: 1000;
    padding: 10px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;`

  controlsToggle.addEventListener('click', () => {
    player.toggleControls()
    controlsToggle.textContent = getButtonTitle()
  })

  return controlsToggle
}

function createDashboard(...args: HTMLElement[])
{
  const dashboard = document.createElement('div')
  dashboard.setAttribute('class', 'dashboard-demo')
  dashboard.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 160px;
    display: flex;
    flex-flow: column;
    justify-content: stretch;
    gap: 7px;
    padding: 7px;
    background: rgba(0, 0, 0, 0.5);
    border: thin solid rgb(75, 75, 75);
    border-radius: 5px;
    z-index: 1000;`

  document.body.appendChild(dashboard)
  args.forEach(el => {
    dashboard.appendChild(el)
  })
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
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      getVideoUrl('Synthwave.mp4'),
      getVideoUrl('GalaxyNebula.mp4')
    ]
    videoPlayer.maxWidth = '960px'
    videoPlayer.aspectRatio = '16:9'
    videoPlayer.loop = true
    videoPlayer.loopMode = 'none'
    videoPlayer.muted = true
    videoPlayer.autoPlay = false
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
      console.log('Loop mode changed to:', mode)
    })

    createDashboard(
      createDemoControlsToggle(player),
      createDemoDashboardInfo(player)
    )

    if (player.logging) {
      console.log('Video Player initialized successfully')
    }

  } catch (error) {
    errorHandler(error as Error)
  }
})
