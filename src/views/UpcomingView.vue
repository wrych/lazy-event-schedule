<script setup lang="ts">
import { computed } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import EventCard from '@/components/EventCard.vue'
import { RouterLink, useRoute } from 'vue-router'
import { preserveDebugQuery } from '@/utils/linkHelper'
import type { EventData } from '@/types'

const props = defineProps({
  count: {
    type: Number,
    default: 7,
  },
})

const eventStore = useEventStore()
const route = useRoute()

const upcomingEvents = computed(() => eventStore.getUpcomingStructuredEvents(props.count))
const overviewLink = computed(() => preserveDebugQuery(route, { name: 'overview' }))

function getDateKey(date: Date | null): string | null {
  if (!date || isNaN(date.getTime())) return null
  return date.toISOString().split('T')[0]
}

function formatDateForSeparator(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return ''
  return date.toLocaleDateString(navigator.language || 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function shouldShowSeparator(
  currentEvent: EventData,
  index: number,
  allEvents: EventData[],
): boolean {
  if (index === 0) return true

  const currentEventDateKey = getDateKey(currentEvent.start)
  let previousEventDateKey: string | null = null
  for (let i = index - 1; i >= 0; i--) {
    previousEventDateKey = getDateKey(allEvents[i].start)
    if (previousEventDateKey) break
  }

  return !!currentEventDateKey && currentEventDateKey !== previousEventDateKey
}
</script>

<template>
  <div class="home-view">
    <h1>Upcoming Events</h1>
    <div>
      <ul v-if="upcomingEvents.length > 0" class="event-list">
        <template v-for="(event, index) in upcomingEvents" :key="event.id">
          <li v-if="shouldShowSeparator(event, index, upcomingEvents)" class="day-separator" aria-hidden="true">
            {{ formatDateForSeparator(event.start) }}
          </li>
          <EventCard :event="event" :show-date="true" />
        </template>
      </ul>
      <p v-else-if="!eventStore.isLoading">No upcoming events found.</p>
      <p style="margin-top: 20px">
        <RouterLink :to="overviewLink">View Full Schedule Overview</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  padding-bottom: 2rem;
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.day-separator {
  margin-top: calc(var(--spacing-unit) * 4);
  margin-bottom: calc(var(--spacing-unit) * 2);
  padding-top: calc(var(--spacing-unit) * 1.5);
  padding-bottom: calc(var(--spacing-unit) * 0.5);
  border-bottom: 1px solid var(--border-color);
  font-weight: bold;
  font-size: 1.1em;
  color: var(--dectris-blue);
}

.event-list>li:first-child.day-separator {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.event-list :deep(.event-item[data-type='detail']) {
  margin-left: calc(var(--spacing-unit) * 3);
}
</style>