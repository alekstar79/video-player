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
      icon: 'list-ul',
      hint: 'Playlist'
    },
    {
      icon: 'forward',
      hint: 'Forward',
      rotate: -90
    },
    {
      icon: 'expand',
      hint: 'Fullscreen'
    },
    {
      icon: 'folder-open',
      hint: 'Open'
    },
    {
      icon: 'backward',
      hint: 'Backward',
      rotate: 90
    },
    {
      icon: 'camera',
      hint: 'Preview',
    }
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
