import { registerComponents, createPlayer } from '@alekstar79/video-player'
import videos from '../../../videos'

registerComponents()

/**
 * Main application entry point
 * Initializes the video player when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const container = document.getElementById('app')!

    container.innerHTML = ''

    await createPlayer(container, {
      initialSources: videos,
      contextMenu: true
    })

  } catch (error) {
    console.error(error)
  }
})
