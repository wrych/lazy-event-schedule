<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue' // <--- IMPORT nextTick
import type { Ref } from 'vue'
import { useTimeStore } from '@/stores/timeStore'
import type { EventData } from '@/types'

// Props definition with TypeScript
const props = defineProps<{
  timelineContainerRef: Ref<HTMLElement | null>
  dayEvents: EventData[]
}>()

const timeStore = useTimeStore()
const indicatorTop: Ref<string> = ref('0%')
const isVisible: Ref<boolean> = ref(false)

const dayBoundaries = computed(() => {
  if (!props.dayEvents || props.dayEvents.length === 0) {
    return { start: null, end: null }
  }
  let firstEventStart: Date | null = null
  let lastEventEnd: Date | null = null
  props.dayEvents.forEach((event) => {
    const eventStart = event.start ?? null
    const eventEnd = event.end ?? event.start ?? null

    if (eventStart && (!firstEventStart || eventStart < firstEventStart)) {
      firstEventStart = eventStart
    }

    if (eventEnd && (!lastEventEnd || eventEnd > lastEventEnd)) {
      lastEventEnd = eventEnd
    }
  })
  if (firstEventStart && lastEventEnd) {
    if ((firstEventStart as Date).getTime() === (lastEventEnd as Date).getTime()) {
      lastEventEnd = new Date((lastEventEnd as Date).getTime() + 60 * 60 * 1000)
    }
  }
  else if (firstEventStart && !lastEventEnd) {
    lastEventEnd = new Date((firstEventStart as Date).getTime() + 60 * 60 * 1000)
  }
  return {
    start: firstEventStart,
    end: lastEventEnd,
  }
})
function calculatePosition(): void {
  const containerRef = props.timelineContainerRef?.value
  if (!containerRef) {
    isVisible.value = false
    return
  }
  const { start: dayStart, end: dayEnd } = dayBoundaries.value
  if (!dayStart || !dayEnd) {
    isVisible.value = false
    return
  }
  const dayStartSafe: Date = dayStart as Date
  const dayEndSafe: Date = dayEnd as Date
  if (dayEndSafe <= dayStartSafe) {
    isVisible.value = false
    return
  }
  const now = timeStore.currentTime
  if (!now) {
    isVisible.value = false
    return
  }
  const dayDurationMs = dayEndSafe.getTime() - dayStartSafe.getTime()
  const timeElapsedMs = now.getTime() - dayStartSafe.getTime()
  if (timeElapsedMs < 0 || timeElapsedMs > dayDurationMs) {
    isVisible.value = false
    return
  }
  const percentage = (timeElapsedMs / dayDurationMs) * 100
  indicatorTop.value = `${Math.min(100, Math.max(0, percentage))}%`
  isVisible.value = true
}


// Watchers
watch(() => timeStore.currentTime, calculatePosition, { immediate: true })
watch(() => props.timelineContainerRef?.value, calculatePosition)
watch(() => props.dayEvents, calculatePosition, { deep: true, immediate: true })

onMounted(() => {
  // Use nextTick correctly
  nextTick(() => {
    // <--- FIX HERE: Call imported nextTick directly
    calculatePosition()
  })
})
</script>

<template>
  <div v-if="isVisible" class="current-time-line" :style="{ top: indicatorTop }" aria-hidden="true"></div>
</template>

<style scoped>
/* Styles are in global style.css */
</style>
