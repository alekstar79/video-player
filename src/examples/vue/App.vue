<template>
  <VideoPlayer :initialSources="videos" contextMenu />
</template>

<script setup lang="ts">
import VideoPlayer from '@alekstar79/video-player/vue'
import videos from '../../../videos'
</script>
