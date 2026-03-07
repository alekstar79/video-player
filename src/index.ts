import { IConfig, ISector, Manager, defineConfig } from '@alekstar79/context-menu'

import type { VideoPlayerConfig } from './types'
import { VideoPlayer } from './core/VideoPlayer'
import { Helpers } from '@/core/utils'

import {
  VideoPlayerComponent,
  registerComponents,
  whenDefined
} from './modules/ui/web-components'

type ContextMenuConfig = Partial<IConfig>

export const defaultPlayerConfig: Partial<VideoPlayerConfig> = {
  initialSources: [],
  maxWidth: '960px',
  aspectRatio: '16:9',
  loopMode: 'all',
  initialVolume: 0.7,
  playbackRate: 1.0,
  autoPlay: false,
  muted: false,
  logging: false,
  showControls: true,
  contextMenu: false,
  controlsVisibility: {
    showFullscreen: true,
    showLoop: true,
    showOpenFile: true,
    showPip: true,
    showPlayPause: true,
    showSkipButtons: true,
    showSpeed: true,
    showTimeDisplay: true,
    showTimeline: true,
    showVolume: true
  }
}

export const defaultContextConfig = defineConfig({
  sprite: './icons.svg',
  autoBindContextMenu: false,
  innerRadius: 75,
  outerRadius: 150,
  opacity: 0.7,
  zIndex: 9,
  hintPadding: 2,
  iconScale: 0.75,
  centralButton: { icon: 'play', hint: 'Play' },
  sectors: [
    { icon: 'playlist', hint: 'Playlist' },
    { icon: 'next', hint: 'Next', rotate: -90 },
    { icon: 'expand', hint: 'Fullscreen' },
    { icon: 'open', hint: 'Open' },
    { icon: 'prev', hint: 'Prev', rotate: 90 },
    { icon: 'preview', hint: 'Preview' }
  ]
})

const isContextConfig = (obj: any): obj is ContextMenuConfig => typeof obj === 'object' && obj !== null

export const resolver = (
  player: VideoPlayer | PromiseLike<VideoPlayer>,
  contextConfig: IConfig
): PromiseLike<{
  manager: Manager,
  player: VideoPlayer
}> => Helpers.isPromiseLike(player)
  ? player.then((player) => ({
    manager: new Manager(player.playerElement, contextConfig),
    player
  }))
  : Promise.resolve({
    manager: new Manager(player.playerElement, contextConfig),
    player
  })

export async function createContextMenu(
  vp: VideoPlayer | PromiseLike<VideoPlayer>,
  contextConfig: IConfig
): Promise<void> {
  const { player, manager } = await resolver(vp, contextConfig)

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

  player.on('fullscreenchange', (isFullscreen?: boolean) => {
    manager.menu.hide()
    manager.menu.config.sectors.some((sector: ISector, idx: number) => {
      if (sector.hint === 'Fullscreen') {
        manager.menu.config.sectors[idx] = {
          icon: isFullscreen ? 'compress' : 'expand',
          hint: 'Fullscreen'
        }
      }
    })
  })

  player.playerElement
    .addEventListener('contextmenu', e => {
      e.preventDefault()
      manager.menu.updateButtons()
      manager.show(e)
    })
}

export async function createPlayer(
  container: HTMLElement,
  config: Partial<VideoPlayerConfig>
): Promise<VideoPlayer | null> {
  try {
    await whenDefined()

    const videoPlayer = document.createElement('video-player') as VideoPlayerComponent
    Object.assign(videoPlayer, defaultPlayerConfig, config)
    container.appendChild(videoPlayer)

    const playerInstance = await videoPlayer.whenReady()
    const contextMenu = isContextConfig(config.contextMenu)
      ? Object.assign({}, defaultContextConfig, config.contextMenu)
      : Boolean(config.contextMenu)

    console.log('createPlayer:playerInstance', videoPlayer, playerInstance)

    if (contextMenu) {
      await createContextMenu(
        playerInstance,
        typeof contextMenu === 'boolean'
          ? defaultContextConfig
          : contextMenu
      )
    }

    return playerInstance

  } catch (e) {
    console.log(e)
  }

  return null
}

export {
  type VideoPlayerComponent,
  type VideoPlayerConfig,
  registerComponents,
  whenDefined
}
