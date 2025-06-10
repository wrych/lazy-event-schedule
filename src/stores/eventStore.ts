import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { EventData, RawEventData, EventsByDay, DetailEventsMap } from '@/types'
import { useTimeStore } from './timeStore' // Import time store

// Helper function outside the store definition
function generateEventId(event: RawEventData, index: number): string {
  const namePart = event.event_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 30)
  const timePart = event.start_datetime || `no-start-${index}`
  const typePart = event.type || 'no-type'
  return `${namePart}-${timePart}-${typePart}`.replace(/--+/g, '-').replace(/-$/, '')
}

export const useEventStore = defineStore('eventStore', () => {
  const rawEvents: Ref<RawEventData[]> = ref([])
  const isLoading: Ref<boolean> = ref(false)
  const error: Ref<string | null> = ref(null)

  // --- Core State ---
  const allEvents: Ref<EventData[]> = ref([])
  const eventsByDay: Ref<EventsByDay> = ref({})
  const detailEventsMap: Ref<DetailEventsMap> = ref(new Map())

  // --- Actions ---
  async function fetchEvents(): Promise<void> {
    if (allEvents.value.length > 0 && !error.value) return // Avoid refetch unless error occurred
    isLoading.value = true
    error.value = null
    console.log('Fetching events...')
    try {
      const response = await fetch('/events.json') // Fetches from public folder
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      rawEvents.value = await response.json()
      console.log('Events fetched, processing...')
      processEvents()
      console.log('Events processed.')
    } catch (err: any) {
      console.error('Failed to load events:', err)
      error.value = err.message || 'Failed to load event data.'
      // Reset state on error?
      allEvents.value = []
      eventsByDay.value = {}
      detailEventsMap.value = new Map()
    } finally {
      isLoading.value = false
    }
  }

  function processEvents(): void {
    const processed: EventData[] = []
    const uniqueEventsCheck = new Map<string, boolean>()
    const tempDetailEvents: EventData[] = [] // Store fully processed detail events
    const tempEventsByDay: EventsByDay = {}
    const tempDetailMap: DetailEventsMap = new Map()

    rawEvents.value.forEach((rawEvent, index) => {
      // Create the processed event object with type safety
      const event: EventData = {
        ...rawEvent,
        id: generateEventId(rawEvent, index),
        start: rawEvent.start_datetime ? new Date(rawEvent.start_datetime) : null,
        end: rawEvent.end_datetime ? new Date(rawEvent.end_datetime) : null,
        start_datetime: rawEvent.start_datetime || null, // Ensure null if empty
        end_datetime: rawEvent.end_datetime || null, // Ensure null if empty
        parent_event: rawEvent.parent_event || null, // Ensure null if empty
      }

      // Simple duplicate check
      const uniqueKey = `${event.event_name}-${event.start_datetime}-${event.end_datetime}-${event.type}`
      if (!uniqueEventsCheck.has(uniqueKey)) {
        uniqueEventsCheck.set(uniqueKey, true)

        processed.push(event)

        // Separate detail events *after* full processing
        if (event.type === 'detail' && event.parent_event) {
          tempDetailEvents.push(event)
        }

        // Group by day
        if (event.start) {
          const dayKey = event.start.toISOString().split('T')[0]
          if (!tempEventsByDay[dayKey]) {
            tempEventsByDay[dayKey] = []
          }
          tempEventsByDay[dayKey].push(event)
          // Sort events within the day
          tempEventsByDay[dayKey].sort(
            (a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0),
          )
        }
      } else {
        // console.warn("Skipping potential duplicate event:", event.event_name, event.start_datetime);
      }
    })

    // Sort all processed events (excluding details initially for some views?)
    // If needed, sort `processed` list here based on start time
    processed.sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))

    // Link detail events to their parents
    tempDetailEvents.forEach((detailEvent) => {
      if (detailEvent.parent_event) {
        // Type guard
        if (!tempDetailMap.has(detailEvent.parent_event)) {
          tempDetailMap.set(detailEvent.parent_event, [])
        }
        tempDetailMap.get(detailEvent.parent_event)?.push(detailEvent)
      }
    })

    // Update reactive refs
    allEvents.value = processed // Contains ALL events now, including details
    eventsByDay.value = tempEventsByDay // Contains events grouped by day (might include details if they have a time)
    detailEventsMap.value = tempDetailMap
  }

  // --- Getters (Computed Properties) ---
  const getEventById: ComputedRef<(eventId: string) => EventData | undefined> = computed(() => {
    return (eventId: string) => allEvents.value.find((e) => e.id === eventId)
  })

  const getEventsForDay: ComputedRef<(dayKey: string) => EventData[]> = computed(() => {
    // Returns all events (overview and detail) associated with that day's key
    return (dayKey: string) => eventsByDay.value[dayKey] || []
  })

  const getChildEvents: ComputedRef<(parentEventName: string) => EventData[]> = computed(() => {
    return (parentEventName: string) => detailEventsMap.value.get(parentEventName) || []
  })

  const sortedDayKeys: ComputedRef<string[]> = computed(() => {
    return Object.keys(eventsByDay.value).sort()
  })

  // Getter for upcoming overview events - uses timeStore's currentTime
  const upcomingOverviewEvents: ComputedRef<EventData[]> = computed(() => {
    const timeStore = useTimeStore() // Access time store here
    const now = timeStore.currentTime
    if (!now || isLoading.value || allEvents.value.length === 0) {
      return []
    }
    return (
      allEvents.value
        .filter((event) => event.type === 'overview' && event.start && event.start > now)
        // Already sorted by processEvents, just slice
        .slice(0, 5)
    )
  })
  const _upcomingOverviewEventsBase: ComputedRef<EventData[]> = computed(() => {
    const timeStore = useTimeStore()
    const now = timeStore.currentTime

    console.log(
      `[EventStore] _upcomingOverviewEventsBase: Calculating... Now: ${now?.toISOString()}, Loading: ${isLoading.value}, Events Available: ${allEvents.value.length}`,
    ) // Keep for debug

    if (!now || isLoading.value || allEvents.value.length === 0) {
      return []
    }

    const filtered = allEvents.value.filter((event) => {
      if (event.type !== 'overview') {
        return false
      }

      const hasValidStart = event.start && !isNaN(event.start.getTime())
      const hasValidEnd = event.end && !isNaN(event.end.getTime())

      const isStrictlyFuture = hasValidStart && event.start! > now
      if (isStrictlyFuture) {
        return true
      }

      const hasStartedOrNow = hasValidStart && event.start! <= now
      const notEnded = !hasValidEnd || event.end! > now

      if (hasStartedOrNow && notEnded) {
        return true
      }
      return false
    })

    return filtered
  })

  const upcomingStructuredEvents: ComputedRef<EventData[]> = computed(() => {
    const timeStore = useTimeStore()
    const now = timeStore.currentTime
    const potentialUpcomingParents = _upcomingOverviewEventsBase.value
      .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))
      .slice(0, 5)

    const result: EventData[] = []
    potentialUpcomingParents.forEach((parent) => {
      result.push(parent)
      const children = getChildEvents
        .value(parent.event_name)
        .filter(
          (child) => (child.end && !isNaN(child.end.getTime()) && child.end > now) || !child.start,
        )
      result.push(...children)
    })
    console.log('[EventStore] upcomingStructuredEventsForHome: Structured count:', result.length)
    return result
  })

  // --- Return statement (keep existing) ---
  return {
    // State
    isLoading,
    error,
    allEvents,
    eventsByDay,
    detailEventsMap, // Ensure map is returned

    // Actions
    fetchEvents,

    // Getters
    getEventById,
    getEventsForDay,
    getChildEvents, // Ensure getter is returned
    sortedDayKeys,
    upcomingStructuredEventsForHome: upcomingStructuredEvents,
    upcomingOverviewEvents: _upcomingOverviewEventsBase, // Keep original accessible
  }
})
