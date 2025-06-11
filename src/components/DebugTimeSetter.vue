<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTimeStore } from '@/stores/timeStore'

const timeStore = useTimeStore()

// Local state for the input field, formatted for datetime-local
const localDebugTimeString = ref('')

// Function to format Date object to 'YYYY-MM-DDTHH:mm'
function formatDateTimeLocal(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return ''
  // Adjust for local timezone offset before formatting
  const offset = date.getTimezoneOffset() * 60000
  const localDate = new Date(date.getTime() - offset)
  return localDate.toISOString().slice(0, 16)
}

// Initialize local input string when component mounts or debugTime changes
watch(
  () => timeStore.debugTime,
  (newDate) => {
    localDebugTimeString.value = formatDateTimeLocal(newDate)
  },
  { immediate: true },
)

// Update the store when the local input string changes
function handleTimeInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  // Input value is typically in UTC based on ISO string slice, convert back
  timeStore.setDebugTime(target.value)
}

// Handle checkbox change - Directly call store action
function handleCheckboxChange(event: Event) {
  const target = event.target as HTMLInputElement
  timeStore.toggleDebugMode(target.checked)
}
</script>

<template>
  <div class="debug-controls">
    <label for="debug-mode-toggle">Debug Time:</label>
    <input type="checkbox" id="debug-mode-toggle" :checked="timeStore.isDebugModeActive" @change="handleCheckboxChange"
      title="Enable manual time setting" />
    <input type="datetime-local" id="debug-time-input" v-model="localDebugTimeString" @input="handleTimeInputChange"
      :disabled="!timeStore.isDebugModeActive" title="Set the time used by the app" />
  </div>
</template>

<style scoped>
/* Scoped styles from previous answer */
.debug-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  background-color: #fff3cd;
  padding: 8px 15px;
  border-radius: 5px;
  border: 1px solid #ffeeba;
  font-size: 0.9em;
  margin-top: 10px;
}

.debug-controls label {
  margin-right: 5px;
  font-weight: bold;
  color: #856404;
}

.debug-controls input[type='checkbox'] {
  margin-right: 10px;
  cursor: pointer;
}

.debug-controls input[type='datetime-local'] {
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}
</style>
