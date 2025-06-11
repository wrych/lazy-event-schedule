<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useEventStore } from '@/stores/eventStore'
import EventCard from '@/components/EventCard.vue' // Use the consistent card
import TimeIndicator from '@/components/TimeIndicator.vue'
import type { EventData } from '@/types'
import { preserveDebugQuery } from '@/utils/linkHelper'

const props = defineProps<{
  date: string // YYYY-MM-DD from route params
}>()

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()

const dayEventsSource = ref<EventData[]>([]) // Raw events for the day from store
const dayDate = ref<Date | null>(null)
const timelineContainerRef = ref<HTMLElement | null>(null)

// Fetch and update events when the date prop changes
watch(
  () => props.date,
  (newDate) => {
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      console.error('Invalid date format received:', newDate)
      router.replace({ name: 'NotFound' })
      return
    }
    // Get events for the day based on their start time
    dayEventsSource.value = eventStore.getEventsForDay(newDate)
    try {
      dayDate.value = new Date(newDate + 'T00:00:00')
    } catch {
      dayDate.value = null
    }
  },
  { immediate: true },
)

const formattedDayDate = computed(() => {
  if (!dayDate.value) return 'Invalid Date'
  return formatDate(dayDate.value)
})

const overviewLink = computed(() => preserveDebugQuery(route, { name: 'overview' }))

function formatDate(
  date: Date | string | null,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string {
  // ... (keep existing formatter) ...
  if (!date) return ''
  try {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString(navigator.language || 'en-US', options)
  } catch {
    return String(date)
  }
}

const timelineContainerProp = computed(() => timelineContainerRef)
const structuredEvents = computed(() => {
  const result: EventData[] = []
  const processedChildIds = new Set<string>() // Keep track of children already added

  // 1. Add all overview events for the day
  const overviewEvents = dayEventsSource.value.filter((e) => e.type === 'overview')
  overviewEvents.forEach((parentEvent) => {
    result.push(parentEvent)
    // Immediately find and add its children
    const children = eventStore.getChildEvents(parentEvent.event_name)
    children.forEach((child) => {
      result.push(child)
      processedChildIds.add(child.id) // Mark child as added
    })
  })

  // 2. Add any detail events that have a start time for *this day*
  //    but whose parent wasn't listed today (or they have no parent listed).
  //    Ensure we don't add children that were already added above.
  const standaloneDetailEvents = dayEventsSource.value.filter(
    (e) => e.type === 'detail' && !processedChildIds.has(e.id),
  )
  result.push(...standaloneDetailEvents)

  // 3. Sort the combined list primarily by time.
  //    Children without time should effectively inherit parent's time for sorting.
  result.sort((a, b) => {
    let timeA = a.start?.getTime()
    let timeB = b.start?.getTime()

    // If 'a' is a child without time, use its parent's time if possible
    if (a.type === 'detail' && !timeA && a.parent_event) {
      const parentA = overviewEvents.find((p) => p.event_name === a.parent_event)
      timeA = parentA?.start?.getTime()
    }
    // If 'b' is a child without time, use its parent's time if possible
    if (b.type === 'detail' && !timeB && b.parent_event) {
      const parentB = overviewEvents.find((p) => p.event_name === b.parent_event)
      timeB = parentB?.start?.getTime()
    }

    // Fallback for items still without time (assign a very large number to push them down?)
    // Or assign 0 to keep them potentially early if no parent time found. Let's use 0.
    const resolvedTimeA = timeA ?? 0
    const resolvedTimeB = timeB ?? 0

    if (resolvedTimeA !== resolvedTimeB) {
      return resolvedTimeA - resolvedTimeB
    }

    // Secondary sort: If times are equal (or both 0/null), ensure parent comes before child
    if (a.type === 'overview' && b.type === 'detail' && b.parent_event === a.event_name) return -1
    if (b.type === 'overview' && a.type === 'detail' && a.parent_event === b.event_name) return 1

    // Tertiary sort: by name if times and parent/child relationship are inconclusive
    return a.event_name.localeCompare(b.event_name)
  })

  return result
})
</script>

<template>
  <div class="day-detail-view">
    <RouterLink :to="overviewLink" class="back-link">Back to Overview</RouterLink>
    <h1 class="day-detail-header">{{ formattedDayDate }}</h1>

    <!-- Pass dayEventsSource (events *with* times) to TimeIndicator for boundary calc -->
    <div v-if="dayEventsSource.length > 0" class="timeline-container" ref="timelineContainerRef">
      <TimeIndicator :timeline-container-ref="timelineContainerProp" :day-events="dayEventsSource" />

      <!-- Render the correctly structured and sorted list using EventCard -->
      <ul class="event-list">
        <EventCard v-for="event in structuredEvents" :key="event.id" :event="event" />
      </ul>
    </div>
    <!-- Handle case where dayEventsSource is empty but structuredEvents might have children -->
    <div v-else-if="structuredEvents.length > 0">
      <ul class="event-list">
        <EventCard v-for="event in structuredEvents" :key="event.id" :event="event" />
      </ul>
    </div>
    <p v-else>No events scheduled for this day.</p>
  </div>
</template>

<style scoped>
/* ... (keep existing styles) ... */
.day-detail-view {
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

.day-detail-header {
  margin-bottom: 1.5rem;
}

.timeline-container {
  position: relative;
  padding-left: 15px;
  margin-left: -15px;
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
