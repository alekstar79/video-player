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
    {
      icon: 'expand',
      hint: 'Fullscreen'
    },
    {
      icon: 'open',
      hint: 'Open'
    },
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
    hint: 'Play'
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
    manager.menu.hide()
    manager.menu.config.centralButton = { icon: 'pause', hint: 'Pause' }
  })

  player.on('pause', () => {
    manager.menu.hide()
    manager.menu.config.centralButton = { icon: 'play', hint: 'Play' }
  })

  player.playerElement
    .addEventListener('contextmenu', e => {
      e.preventDefault()
      manager.menu.updateButtons()
      manager.show(e)
    })
}

export { styles }
