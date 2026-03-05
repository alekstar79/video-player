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
  zIndex: 9,
  hintPadding: 2,
  // iconRadius: 100, // Uncomment to move all icons further out
  iconScale: 0.75,
  sectors: [
    {
      icon: 'playlist',
      hint: 'Playlist'
    },
    {
      icon: 'next',
      hint: 'Next',
      rotate: -90
    },
    // {
    //   icon: 'forward',
    //   hint: 'Forward',
    //   rotate: -90
    // },
    {
      icon: 'expand',
      hint: 'Fullscreen'
    },
    {
      icon: 'open',
      hint: 'Open'
    },
    // {
    //   icon: 'backward',
    //   hint: 'Backward',
    //   rotate: 90
    // },
    {
       icon: 'prev',
       hint: 'Prev',
       rotate: 90
    },
    {
      icon: 'preview',
      hint: 'Preview',
    },

  ],
  centralButton: {
    icon: 'play',
    hint: 'Play',
    // hintSpan: 180,
    // iconRadius: 50,
    // iconScale: 0.75
    // hintPosition: 'bottom'
  }
})

const resolver = (player: VideoPlayer | PromiseLike<VideoPlayer>) => {
  return Helpers.isPromiseLike(player)
    ? player.then((player) => ({
      manager: new Manager(player.playerElement, config()),
      player
    }))
    : Promise.resolve({
      manager: new Manager(player.playerElement, config()),
      player
    })
}

export const createContextMenu = async (vp: VideoPlayer | PromiseLike<VideoPlayer>) => {
  const { player, manager } = await resolver(vp)

  player.context = manager
  manager.menu.updateButtons()

  manager.on('click', (data: ISector) => {
    player.events.emit('context', data)
  })

  player.on('play', () => {
    manager.menu.config.centralButton = { icon: 'pause', hint: 'Pause' }
    manager.menu.updateButtons()
  })

  player.on('pause', () => {
    manager.menu.config.centralButton = { icon: 'play', hint: 'Play' }
    manager.menu.updateButtons()
  })

  player.playerElement
    .addEventListener('contextmenu', e => {
      e.preventDefault()
      manager.show(e)
    })
}

export { styles }
