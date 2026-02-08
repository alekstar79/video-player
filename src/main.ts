import { registerComponents, createPlayer } from '.'

import videos from '../videos'
import './styles/main.scss'

// Register web components (not required if created using createPlayer)
registerComponents()

const errorHandler = (error: Error | any) => {
  console.error('Failed to initialize video player:', error)

  document.body.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">
<h2>Error Loading Video Player</h2>
<p><strong>${error instanceof Error ? error.message : 'Unknown error'}</strong></p>
<p>Please check the browser console for more details.</p>
<p>Make sure you have a stable internet connection for loading icons and fonts.</p>
</div>
`
}

const getContainer = (): HTMLElement => {
  const container = document.getElementById('app')

  if (!container) {
    throw new Error('App container element not found')
  }

  return container
}

/**
 * Main application entry point
 * Initializes the video player when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const container = getContainer()

    container.innerHTML = ''

    // Create video-player instance
    const player = await createPlayer(container, {
      // initialSources: videos
    })

    player.setSources(videos)

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
