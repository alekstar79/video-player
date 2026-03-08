<template>
  <div ref="playerContainerRef" style="display: contents;"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, toRefs, getCurrentInstance, useTemplateRef } from 'vue'

import type { ISector } from '@alekstar79/context-menu'
import type { VideoPlayer } from '@/core/VideoPlayer'
import type {
  VideoPlayerConfig,
  TimeUpdateEvent,
  VolumeChangeEvent,
  PlaybackRateEvent,
  LoopMode
} from '@/types'

import { registerComponents, createPlayer } from '@/index'

registerComponents()

// Define props for the component, mirroring VideoPlayerConfig
const props = withDefaults(defineProps<Partial<VideoPlayerConfig>>(), {
  aspectRatio: '16:9',
  initialVolume: 0.7,
  maxWidth: '960px',
  showControls: true,
  nextButton: true,
  prevButton: true,
})

// Define emits using the correct call-signature syntax required by Vue
const emit = defineEmits<{
  (e: 'play'): void;
  (e: 'pause'): void;
  (e: 'ended'): void;
  (e: 'loadedmetadata'): void;
  (e: 'mounted'): void;
  (e: 'timeupdate', payload: TimeUpdateEvent): void;
  (e: 'volumechange', payload: VolumeChangeEvent): void;
  (e: 'playbackratechange', payload: PlaybackRateEvent): void;
  (e: 'fullscreenchange', payload: boolean): void;
  (e: 'error', payload: Error): void;
  (e: 'sourcechanged', payload: number): void;
  (e: 'loopmodechanged', payload: LoopMode): void;
  (e: 'context', payload: ISector): void;
}>()

const instance = getCurrentInstance()
const playerContainerRef = useTemplateRef<HTMLElement>('playerContainerRef')
let playerInstance: VideoPlayer | null = null

// Expose the player instance's API
defineExpose({
  play: () => playerInstance?.play(),
  pause: () => playerInstance?.pause(),
  togglePlay: () => playerInstance?.togglePlay(),
  seekTo: (time: number) => playerInstance?.seekTo(time),
  setVolume: (volume: number) => playerInstance?.setVolume(volume),
  setMuted: (muted: boolean) => playerInstance?.setMuted(muted),
  setPlaybackRate: (rate: number) => playerInstance?.setPlaybackRate(rate),
  toggleFullscreen: () => playerInstance?.toggleFullscreen(),
  getPlayerInstance: (): VideoPlayer | null => playerInstance
})

function replaceRoot(newElement: HTMLElement) {
  const oldEl = instance?.vnode.el
  const parent = oldEl?.parentNode

  if (parent && oldEl && newElement) {
    parent.replaceChild(newElement, oldEl)
    instance.vnode.el = newElement
  }
}

async function buildComponent(): Promise<HTMLElement>
{
  playerInstance = await createPlayer(playerContainerRef.value!, { ...props })

  // Type-safe event forwarding with explicit payload checks
  playerInstance.on('play', () => emit('play'))
  playerInstance.on('pause', () => emit('pause'))
  playerInstance.on('ended', () => emit('ended'))
  playerInstance.on('loadedmetadata', () => emit('loadedmetadata'))
  playerInstance.on('mounted', () => emit('mounted'))

  playerInstance.on('timeupdate', (p) => { if (p) emit('timeupdate', p) })
  playerInstance.on('volumechange', (p) => { if (p) emit('volumechange', p) })
  playerInstance.on('playbackratechange', (p) => { if (p) emit('playbackratechange', p) })
  playerInstance.on('fullscreenchange', (p) => { if (p !== undefined) emit('fullscreenchange', p) })
  playerInstance.on('error', (p) => { if (p) emit('error', p) })
  playerInstance.on('sourcechanged', (p) => { if (p !== undefined) emit('sourcechanged', p) })
  playerInstance.on('loopmodechanged', (p) => { if (p) emit('loopmodechanged', p) })
  playerInstance.on('context', (p) => { if (p) emit('context', p) })

  if (playerInstance.container) {
    replaceRoot(playerInstance.container)
  }

  return playerInstance.container
}

onMounted(buildComponent)

onBeforeUnmount(() => {
  if (playerInstance) {
    playerInstance.destroy()
    playerInstance = null
  }
})

// Watch for prop changes and update the player instance
const {
  initialSources,
  initialVolume,
  muted,
  playbackRate,
  loopMode,
} = toRefs(props)

watch(initialSources, (newSources) => {
  if (newSources && playerInstance) {
    playerInstance.setSources(newSources)
  }
})

watch(initialVolume, (newVolume) => {
  if (newVolume !== undefined && playerInstance) {
    playerInstance.setVolume(newVolume)
  }
})

watch(muted, (newMuted) => {
  if (newMuted !== undefined && playerInstance) {
    playerInstance.setMuted(newMuted)
  }
})

watch(playbackRate, (newRate) => {
  if (newRate !== undefined && playerInstance) {
    playerInstance.setPlaybackRate(newRate)
  }
})

watch(loopMode, (newLoopMode) => {
  if (newLoopMode && playerInstance) {
    playerInstance.setLoopMode(newLoopMode)
  }
})
</script>
