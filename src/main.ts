import { VideoPlayer } from './app/VideoPlayer'
import './styles/main.scss'
import './styles/player.scss'

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

    // Create player container
    const playerContainer = document.createElement('div')
    playerContainer.className = 'video-player-container'
    appElement.innerHTML = ''
    appElement.appendChild(playerContainer)

    // Initialize video player
    const player = new VideoPlayer({
      container: playerContainer,

      initialSources: [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        getVideoUrl('Synthwave.mp4'),
        getVideoUrl('GalaxyNebula.mp4')
      ],

      // width: '100%',        // Occupies the entire available width
      maxWidth: '960px',       // but no more than 1200px
      aspectRatio: '16:9',     // Aspect ratio is 16:9

      // Or you can set fixed sizes:
      // width: 800,
      // height: 450,

      loop: true,
      loopMode: 'none', // none | one | all

      muted: true,
      autoPlay: false,
      initialVolume: 0.7,
      playbackRate: 1.0,
      showControls: true,
      logging: false,

      controlsVisibility: {
        showOpenFile: true,     // Show/Hide the file open button
        showPlayPause: true,    // Show/Hide the play/pause button
        showSkipButtons: true,  // Show/Hide the rewind buttons
        showVolume: true,       // Show/Hide the volume button
        showTimeDisplay: true,  // Show/Hide the time display
        showSpeed: true,        // Show/Hide the speed selection
        showPip: true,          // Show/Hide the picture-in-picture button
        showFullscreen: true,   // Show/Hide the fullscreen button
        showLoop: true,         // Show/Hide the loop button
        showTimeline: true      // Show/Hide the timeline bar
      }
    })

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
