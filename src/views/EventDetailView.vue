<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useEventStore } from '@/stores/eventStore'
import type { EventData } from '@/types'
import { preserveDebugQuery } from '@/utils/linkHelper'
import EventCard from '@/components/EventCard.vue' // Make sure this is imported

const props = defineProps<{
  id: string // Event ID from route params
}>()

const route = useRoute()
const eventStore = useEventStore() // Defined here, should be available

const event = ref<EventData | null>(null)
const childEvents = ref<EventData[]>([])

// --- Watchers and computed properties (Keep existing logic) ---
watch(
  () => props.id,
  (newEventId) => {
    // console.log(`EventDetailView: ID changed to ${newEventId}. Finding event...`);
    const foundEvent = eventStore.getEventById(newEventId)
    if (foundEvent) {
      // console.log(`EventDetailView: Found event immediately: ${foundEvent.event_name}`);
      event.value = foundEvent
      childEvents.value =
        foundEvent.type === 'overview' ? eventStore.getChildEvents(foundEvent.event_name) : []
    } else {
      // console.log(`EventDetailView: Event not found immediately for ID ${newEventId}. Will re-check after load.`);
      event.value = null // Reset if ID changes and event not found sync
      childEvents.value = []
    }
  },
  { immediate: true },
)

watch(
  () => eventStore.isLoading,
  (loading) => {
    if (!loading && !event.value) {
      // If loading finished AND we still haven't found the event
      // console.log(`EventDetailView: Loading finished. Re-checking for event ID ${props.id}...`);
      const foundEvent = eventStore.getEventById(props.id)
      if (foundEvent) {
        // console.log(`EventDetailView: Found event after loading: ${foundEvent.event_name}`);
        event.value = foundEvent
        childEvents.value =
          foundEvent.type === 'overview' ? eventStore.getChildEvents(foundEvent.event_name) : []
      } else {
        console.warn(`EventDetailView: Event with ID ${props.id} not found after loading.`)
        // Leave event.value as null to trigger the "Not Found" state in template
      }
    }
  },
)

const backLinkTarget = computed(() => {
  // If the event was found and has a start date, link back to its day
  if (event.value?.start) {
    const dayKey = event.value.start.toISOString().split('T')[0]
    return preserveDebugQuery(route, { name: 'day-detail', params: { date: dayKey } })
  }
  // Otherwise (event not found yet, or event has no date), link back to overview
  return preserveDebugQuery(route, { name: 'overview' })
})

// --- Formatters (Keep existing) ---
function formatDate(date: Date | string | null, options: Intl.DateTimeFormatOptions): string {
  if (!date) return ''
  try {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString(navigator.language || 'en-US', options)
  } catch {
    return String(date)
  }
}
function formatTime(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleTimeString(navigator.language || 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
const timeDisplay = computed(() => {
  if (!event.value) return '' // Return empty if event not loaded yet
  const start = event.value.start
  const end = event.value.end
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }
  const dateTimeOptions: Intl.DateTimeFormatOptions = { ...dateOptions, ...timeOptions }
  const startStr = start ? formatDate(start, dateTimeOptions) : ''
  const endStr = end ? formatDate(end, dateTimeOptions) : ''
  const startTimeOnly = start ? formatTime(start) : ''
  const endTimeOnly = end ? formatTime(end) : ''
  if (start && end) {
    if (start.toDateString() === end.toDateString())
      return `${formatDate(start, dateOptions)}, ${startTimeOnly} - ${endTimeOnly}`
    else return `${startStr} - ${endStr}`
  } else if (start) {
    return startStr
  } else if (event.value.type !== 'detail') {
    return 'Date/Time TBC'
  }
  return ''
})
// --- End Formatters ---
</script>

<template>
  <div class="event-detail-view">
    <!-- 1. Handle Loading State -->
    <div v-if="eventStore.isLoading" class="loading">Loading event details...</div>

    <!-- 2. Handle Event Found (only renders if NOT loading AND event has value) -->
    <div v-else-if="event">
      <RouterLink :to="backLinkTarget" class="back-link">Back</RouterLink>
      <div class="event-detail-card">
        <div class="event-time">
          {{ timeDisplay }}
        </div>
        <h1 class="event-name">{{ event.event_name }}</h1>
        <div v-if="event.location" class="event-location">
          <strong>Location:</strong> {{ event.location }}
        </div>
        <div v-if="event.event_description" class="event-description">
          <p v-html="event.event_description.replace(/\n/g, '<br>')"></p>
        </div>
        <div v-if="event.type === 'detail' && event.parent_event" class="event-meta">
          Part of: {{ event.parent_event }}
        </div>
      </div>

      <!-- List child events if they exist -->
      <div v-if="childEvents.length > 0" class="child-events-section">
        <h2>Activities / Related</h2>
        <ul class="child-events-list event-list">
          <EventCard v-for="child in childEvents" :key="child.id" :event="child" />
        </ul>
      </div>
    </div>

    <!-- 3. Handle Not Found State (only renders if NOT loading AND event is still null) -->
    <div v-else class="not-found">
      <h1>Event Not Found</h1>
      <p>The requested event (ID: {{ id }}) could not be found.</p>
      <!-- Note: backLinkTarget works here because it defaults to overview if event is null -->
      <RouterLink :to="backLinkTarget" class="back-link">Back to Schedule</RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* --- Keep ALL your existing styles --- */
.event-detail-view {
  padding-bottom: 2rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--text-muted);
}

.back-link::before {
  content: '← ';
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  font-size: 1.2em;
}

.not-found {
  text-align: center;
  padding: 2rem;
}

.not-found h1 {
  color: var(--dectris-blue);
  margin-bottom: 1rem;
}

.not-found p {
  margin-bottom: 1.5rem;
  color: var(--text-muted);
}

.event-detail-card {
  background-color: var(--dectris-gray);
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
  border-radius: 5px;
  border: 1px solid var(--border-color);
  margin-bottom: calc(var(--spacing-unit) * 3);
}

.event-detail-card .event-name {
  font-size: 1.8em;
  color: var(--dectris-blue);
  margin-top: calc(var(--spacing-unit) * 0.5);
  margin-bottom: var(--spacing-unit);
}

.event-detail-card .event-time,
.event-detail-card .event-location,
.event-detail-card .event-description,
.event-detail-card .event-meta {
  font-size: 1.05em;
  margin-bottom: var(--spacing-unit);
  line-height: 1.6;
}

.event-detail-card .event-description p {
  margin-top: calc(var(--spacing-unit) * 0.5);
  margin-bottom: 0;
}

.event-meta {
  font-style: italic;
  color: var(--text-muted);
  font-size: 0.9em;
}

.child-events-section {
  margin-top: calc(var(--spacing-unit) * 4);
}

.child-events-section h2 {
  font-size: 1.4em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--spacing-unit);
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.child-events-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.child-events-list .event-item[data-type='detail'] {
  margin-left: 0;
  border-left: 3px solid var(--dectris-lightblue);
}

/* --- End Keep ALL your existing styles --- */
</style>
