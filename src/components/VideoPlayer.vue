<template></template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

interface Props {

}

const props = withDefaults(defineProps<Props>(), {})

const emit = defineEmits<{
  (e: 'click', data): void;
}>()

let menuElement: HTMLElement | null = null

onMounted(() => {
  // do something...
})

onUnmounted(() => {
  // do something...
})

watch(() => [

], () => {

}, { deep: true })

defineExpose({})
</script>
