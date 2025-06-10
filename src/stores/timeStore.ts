import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

export const useTimeStore = defineStore('timeStore', () => {
  const route = useRoute()

  const realCurrentTime: Ref<Date> = ref(new Date())
  const debugTime: Ref<Date> = ref(new Date()) // Initialize with current time
  const isDebugModeActive: Ref<boolean> = ref(false)
  let timerInterval: number | null = null

  // Exposed current time - the single source of truth for time
  const currentTime: ComputedRef<Date> = computed(() => {
    return isDebugModeActive.value ? debugTime.value : realCurrentTime.value
  })

  // Update real time
  function updateRealTime(): void {
    realCurrentTime.value = new Date()
  }

  // Set debug time from string or Date object
  function setDebugTime(newTime: string | Date): void {
    try {
      const date = typeof newTime === 'string' ? new Date(newTime) : newTime
      if (!isNaN(date.getTime())) {
        debugTime.value = date
      } else {
        console.warn('Invalid date provided for debug time:', newTime)
      }
    } catch (e) {
      console.error('Error setting debug time:', e)
    }
  }

  // Toggle debug mode state
  function toggleDebugMode(manualValue: boolean): void {
    isDebugModeActive.value = manualValue
    if (!isDebugModeActive.value) {
      startRealtimeUpdates()
    } else {
      stopRealtimeUpdates()
      // Sync debug time with real time when activating if it hasn't been set manually?
      // Or just leave it as it was. Let's leave it.
    }
    console.log(
      `Debug mode ${
        isDebugModeActive.value ? 'activated' : 'deactivated'
      }. Current effective time: ${currentTime.value.toISOString()}`,
    )
  }

  function startRealtimeUpdates(): void {
    if (timerInterval === null && !isDebugModeActive.value) {
      updateRealTime() // Update once immediately
      // Use window.setInterval for Node.js compatibility if needed, otherwise standard setInterval is fine
      timerInterval = window.setInterval(updateRealTime, 30 * 1000) // Update every 30 seconds
      console.log('Realtime updates started.')
    }
  }

  function stopRealtimeUpdates(): void {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
      console.log('Realtime updates stopped.')
    }
  }

  // Watch route query for debug=true
  watch(
    () => route.query.debug,
    (newDebugQuery) => {
      const shouldBeActive = newDebugQuery === 'true'
      // Only toggle if the state needs to change
      if (shouldBeActive !== isDebugModeActive.value) {
        toggleDebugMode(shouldBeActive)
      }
    },
    { immediate: true }, // Check immediately on load
  )

  onMounted(() => {
    // Initial check based on query param is handled by the watcher
    // Start timer only if NOT in debug mode initially
    if (!isDebugModeActive.value) {
      startRealtimeUpdates()
    }
  })

  onUnmounted(() => {
    stopRealtimeUpdates() // Clean up interval
  })

  return {
    currentTime,
    isDebugModeActive,
    debugTime, // Expose for binding in DebugTimeSetter

    // Actions
    setDebugTime,
    toggleDebugMode, // Allow manual toggling via component
  }
})
