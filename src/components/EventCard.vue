<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { EventData } from '@/types'
import { preserveDebugQuery } from '@/utils/linkHelper' // Import helper

// Props definition with TypeScript
const props = defineProps<{
  event: EventData
}>()

const route = useRoute() // Get current route

// Use helper functions (consider moving to src/utils/formatters.ts)
function formatTime(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleTimeString(navigator.language || 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const timeDisplay = computed(() => {
  const start = formatTime(props.event.start)
  const end = formatTime(props.event.end)
  if (start && end) return `${start} - ${end}`
  if (start) return start
  if (props.event.type !== 'detail' && !start) return '(Time TBC)'
  return ''
})

const descriptionSnippet = computed(() => {
  if (!props.event.event_description) return ''
  const maxLength = 100
  let snippet =
    props.event.event_description.length > maxLength
      ? props.event.event_description.substring(0, maxLength) + '...'
      : props.event.event_description
  snippet = snippet.replace(/<br>/g, ' | ') // Replace non-breaking spaces
  return snippet.replace(/<[^>]+>/g, '') // Remove HTML tags
})

// Compute the target link, preserving query params
const eventDetailLink = computed(() => {
  return preserveDebugQuery(route, { name: 'event-detail', params: { id: props.event.id } })
})
</script>

<template>
  <li class="event-item" :data-type="event.type">
    <!-- Use the computed link -->
    <RouterLink :to="eventDetailLink" class="event-link-wrapper">
      <div class="event-time" v-if="timeDisplay">{{ timeDisplay }}</div>
      <div class="event-name">{{ event.event_name }}</div>
      <div v-if="event.location" class="event-location">{{ event.location }}</div>
      <!-- Show snippet only for non-detail or if explicitly wanted -->
      <div
        v-if="descriptionSnippet && event.type !== 'detail'"
        class="event-description"
        v-html="descriptionSnippet"
      />
      <!-- Show full description for detail types if present -->
      <div
        v-if="event.type === 'detail' && event.event_description"
        class="event-description"
        v-html="event.event_description"
      />
    </RouterLink>
  </li>
</template>

<style scoped>
/* Scoped styles from previous answer */
.event-link-wrapper {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: var(--spacing-unit);
  border-radius: 5px;
  transition: background-color 0.2s ease;
}

.event-item {
  padding: 0;
  border: 1px solid var(--border-color);
  margin-bottom: calc(var(--spacing-unit) * 1.5);
  background-color: var(--white);
  border-radius: 5px;
  transition: box-shadow 0.2s ease;
}

.event-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

/* ... other styles from previous EventCard */
.event-time {
  font-weight: 600;
  color: var(--dectris-blue);
  margin-bottom: calc(var(--spacing-unit) * 0.5);
  font-size: 1em;
}

.event-name {
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: calc(var(--spacing-unit) * 0.5);
}

.event-location,
.event-description {
  font-size: 0.9em;
  color: var(--text-muted);
  margin-bottom: calc(var(--spacing-unit) * 0.5);
}

.event-location::before {
  content: '📍 ';
  margin-right: 4px;
}

.event-item[data-type='detail'] {
  margin-left: calc(var(--spacing-unit) * 3);
  border-left: 3px solid var(--dectris-lightblue);
  background-color: var(--dectris-gray);
}

.event-item[data-type='detail'] .event-name {
  font-weight: normal;
  font-size: 1em;
}
</style>
