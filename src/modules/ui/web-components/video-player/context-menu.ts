import { type ISector, Manager, defineConfig } from '@alekstar79/context-menu'
import { VideoPlayer } from '@/core/VideoPlayer'
import { Helpers } from '@/core/utils'

import styles from '@alekstar79/context-menu/lib/styles.css?inline'

export const config = () => defineConfig({
  sprite: './icons.svg',
  autoBindContextMenu: false,
  innerRadius: 75,
  outerRadius: 150,
  opacity: 0.7,
  hintPadding: 2,
  // Global overrides for all icons
  // iconRadius: 100, // Uncomment to move all icons further out
  iconScale: 0.75, // Uncomment to make all icons smaller
  sectors: [
    {
      icon: 'new',
      hint: 'New',
    },
    {
      icon: 'open',
      hint: 'Open',
    },
    {
      icon: 'link',
      hint: 'Link',
    },
    {
      icon: 'webcam',
      hint: 'Webcam',
      // Manual override for a specific icon
      // iconRadius: 100, // Move this icon further out
      // iconScale: 0.5, // Make this icon smaller
    },
    {
      icon: 'calc',
      hint: 'Calculator',
    },
    {
      icon: 'pixabay',
      hint: 'Pixabay',
    }
  ],
  centralButton: {
    icon: 'about',
    hint: 'Home',
    // hintSpan: 180,
    // iconRadius: 50,
    // iconScale: 0.75
    // hintStartAngle: 290,
    // hintEndAngle: 70,
    // hintPosition: 'bottom'
  }
})

const resolver = (player: VideoPlayer | PromiseLike<VideoPlayer>) => {
  return Helpers.isPromiseLike(player)
    ? player.then((player) => ({
      menu: new Manager(player.playerElement, config()),
      player
    }))
    : Promise.resolve({
      menu: new Manager(player.playerElement, config()),
      player
    })
}

export const createContextMenu = async (vp: VideoPlayer | PromiseLike<VideoPlayer>) => {
  const { player, menu } = await resolver(vp)

  menu.on('click', (data: ISector) => {
    player.events.emit('context', data)
  })

  player.playerElement
    .addEventListener('contextmenu', e => {
      e.preventDefault()
      menu.show(e)
    })
}

export { styles }
