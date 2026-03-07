<template>
  <VideoPlayer :initialSources="videos" contextMenu />
</template>

<script setup lang="ts">
import VideoPlayer from '@/components/VideoPlayer.vue'
import videos from '../videos'
</script>
