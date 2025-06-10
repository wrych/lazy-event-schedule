<script setup lang="ts">
import { computed } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { RouterLink, useRoute } from 'vue-router'
import type { EventData } from '@/types'
import { preserveDebugQuery } from '@/utils/linkHelper'

const eventStore = useEventStore()
const route = useRoute()

// --- Formatters (Keep existing) ---
function formatDate(
  dateStr: string | Date,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string {
  if (!dateStr) return ''
  try {
    const date =
      dateStr instanceof Date
        ? dateStr
        : dateStr.includes('T')
          ? new Date(dateStr)
          : new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(navigator.language || 'en-US', options)
  } catch (e) {
    return String(dateStr)
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
// --- End Formatters ---

// --- REVISED Computed Property ---
const sortedOverviewDays = computed(() => {
  // Directly access reactive store state/getters needed for the calculation
  const keys = eventStore.sortedDayKeys
  const map = eventStore.eventsByDay

  // If keys isn't an array yet (still loading/initializing), return empty
  if (!Array.isArray(keys)) {
    // This log is expected on initial load, it's not an error itself
    // console.warn("OverviewView: sortedDayKeys is not an array yet.");
    return []
  }

  // Filter the keys based on the presence of 'overview' events in the map
  const result = keys.filter((dayKey) => {
    const dayEvents = map[dayKey] // Get events for the day
    // Ensure dayEvents is an array and then check .some()
    return Array.isArray(dayEvents) && dayEvents.some((event) => event.type === 'overview')
  })

  // console.log("OverviewView: Filtered overview days:", result); // Optional: Check result
  return result // Keys are already sorted from the store getter
})

// --- Helper and Link Functions (Keep existing) ---
const getSortedOverviewEventsForDay = (dayKey: string): EventData[] => {
  const dayEvents = eventStore.eventsByDay[dayKey] || []
  return dayEvents
    .filter((e) => e.type === 'overview')
    .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))
}
const getDayDetailLink = (dayKey: string) =>
  preserveDebugQuery(route, { name: 'day-detail', params: { date: dayKey } })
const getEventDetailLink = (eventId: string) =>
  preserveDebugQuery(route, { name: 'event-detail', params: { id: eventId } })
// --- End Helpers ---
</script>

<template>
  <div class="overview-view">
    <h1>Event Overview</h1>
    <!-- Loading state handled by App.vue -->
    <!-- Condition to show 'No events': check AFTER loading AND if the computed array is empty -->
    <div v-if="!eventStore.isLoading && sortedOverviewDays.length === 0">
      <p>No scheduled overview events found.</p>
    </div>
    <!-- Condition to show events: check if array has items (implicitly handles loading state too) -->
    <div v-else-if="sortedOverviewDays.length > 0">
      <div v-for="dayKey in sortedOverviewDays" :key="dayKey" class="day-overview-container">
        <RouterLink :to="getDayDetailLink(dayKey)" class="day-overview-block">
          <div class="day-date-header">{{ formatDate(dayKey) }}</div>
        </RouterLink>
        <ul class="overview-event-list">
          <li
            v-for="event in getSortedOverviewEventsForDay(dayKey)"
            :key="event.id"
            class="overview-event-item-wrapper"
          >
            <RouterLink :to="getEventDetailLink(event.id)" class="overview-event-link">
              <span class="overview-event-time">
                {{ formatTime(event.start) }} {{ event.end ? '- ' + formatTime(event.end) : '' }}
              </span>
              <span class="overview-event-name">{{ event.event_name }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
    <!-- Optional: You could add an explicit loading indicator here too if needed,
          although App.vue should cover the main loading phase -->
    <!-- <div v-else-if="eventStore.isLoading"> Loading Overview... </div> -->
  </div>
</template>

<style scoped>
/* Styles from previous OverviewView */
.overview-view {
  padding-bottom: 2rem;
}

.day-overview-container {
  margin-bottom: calc(var(--spacing-unit) * 3);
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--white);
  transition: box-shadow 0.2s ease;
}

.day-overview-container:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.day-overview-block {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2);
  background-color: var(--dectris-gray);
  border-bottom: 1px solid var(--border-color);
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.day-overview-block:hover .day-date-header {
  color: var(--dectris-lightblue);
}

.day-date-header {
  font-size: 1.3em;
  font-weight: bold;
  color: var(--dectris-blue);
  margin-bottom: 0;
}

.overview-event-list {
  list-style: none;
  padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2)
    calc(var(--spacing-unit) * 1.5);
  margin: 0;
}

.overview-event-item-wrapper {
  margin: 0;
  padding: 0;
}

.overview-event-link {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: calc(var(--spacing-unit) * 0.75) 0;
  font-size: 0.95em;
  border-bottom: 1px dotted var(--border-color);
  text-decoration: none;
  color: var(--text-color);
  transition: background-color 0.15s ease;
}

.overview-event-item-wrapper:last-child .overview-event-link {
  border-bottom: none;
}

.overview-event-link:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.overview-event-time {
  color: var(--text-muted);
  flex-shrink: 0;
  margin-right: var(--spacing-unit);
  min-width: 80px;
  /* Alignment */
}

.overview-event-name {
  flex-grow: 1;
}

@media (max-width: 768px) {
  .overview-event-link {
    flex-direction: column;
    align-items: flex-start;
  }

  .overview-event-time {
    min-width: auto;
    margin-bottom: calc(var(--spacing-unit) * 0.5);
  }
}
</style>
