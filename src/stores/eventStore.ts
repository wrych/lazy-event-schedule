import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { EventData, RawEventData, EventsByDay, DetailEventsMap } from '@/types'
import { useTimeStore } from './timeStore'

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

  const allEvents: Ref<EventData[]> = ref([])
  const eventsByDay: Ref<EventsByDay> = ref({})
  const detailEventsMap: Ref<DetailEventsMap> = ref(new Map())

  async function fetchEvents(): Promise<void> {
    if (allEvents.value.length > 0 && !error.value) return
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch('/events.json')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      rawEvents.value = await response.json()
      processEvents()
    } catch (err: any) {
      console.error('Failed to load events:', err)
      error.value = err.message || 'Failed to load event data.'
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
    const tempDetailEvents: EventData[] = []
    const tempEventsByDay: EventsByDay = {}
    const tempDetailMap: DetailEventsMap = new Map()

    rawEvents.value.forEach((rawEvent, index) => {
      const event: EventData = {
        ...rawEvent,
        id: generateEventId(rawEvent, index),
        start: rawEvent.start_datetime ? new Date(rawEvent.start_datetime) : null,
        end: rawEvent.end_datetime ? new Date(rawEvent.end_datetime) : null,
        start_datetime: rawEvent.start_datetime || null,
        end_datetime: rawEvent.end_datetime || null,
        parent_event: rawEvent.parent_event || null,
      }

      const uniqueKey = `${event.event_name}-${event.start_datetime}-${event.end_datetime}-${event.type}`
      if (!uniqueEventsCheck.has(uniqueKey)) {
        uniqueEventsCheck.set(uniqueKey, true)
        processed.push(event)

        if (event.type === 'detail' && event.parent_event) {
          tempDetailEvents.push(event)
        }

        if (event.start) {
          const dayKey = event.start.toISOString().split('T')[0]
          if (!tempEventsByDay[dayKey]) {
            tempEventsByDay[dayKey] = []
          }
          tempEventsByDay[dayKey].push(event)
          tempEventsByDay[dayKey].sort(
            (a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0),
          )
        }
      }
    })

    processed.sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))

    tempDetailEvents.forEach((detailEvent) => {
      if (detailEvent.parent_event) {
        if (!tempDetailMap.has(detailEvent.parent_event)) {
          tempDetailMap.set(detailEvent.parent_event, [])
        }
        tempDetailMap.get(detailEvent.parent_event)?.push(detailEvent)
      }
    })

    allEvents.value = processed
    eventsByDay.value = tempEventsByDay
    detailEventsMap.value = tempDetailMap
  }

  const getEventById: ComputedRef<(eventId: string) => EventData | undefined> = computed(() => {
    return (eventId: string) => allEvents.value.find((e) => e.id === eventId)
  })

  const getEventsForDay: ComputedRef<(dayKey: string) => EventData[]> = computed(() => {
    return (dayKey: string) => eventsByDay.value[dayKey] || []
  })

  const getChildEvents: ComputedRef<(parentEventName: string) => EventData[]> = computed(() => {
    return (parentEventName: string) => detailEventsMap.value.get(parentEventName) || []
  })

  const sortedDayKeys: ComputedRef<string[]> = computed(() => {
    return Object.keys(eventsByDay.value).sort()
  })

  const _upcomingOverviewEventsBase: ComputedRef<EventData[]> = computed(() => {
    const timeStore = useTimeStore()
    const now = timeStore.currentTime
    if (!now || isLoading.value || allEvents.value.length === 0) {
      return []
    }
    const filtered = allEvents.value.filter((event) => {
      if (event.type !== 'overview') return false
      const hasValidStart = event.start && !isNaN(event.start.getTime())
      const hasValidEnd = event.end && !isNaN(event.end.getTime())
      const isStrictlyFuture = hasValidStart && event.start! > now
      if (isStrictlyFuture) return true
      const hasStartedOrNow = hasValidStart && event.start! <= now
      const notEnded = !hasValidEnd || event.end! > now
      if (hasStartedOrNow && notEnded) return true
      return false
    })
    return filtered
  })

  const _sortedUpcomingEvents: ComputedRef<EventData[]> = computed(() => {
    const timeStore = useTimeStore()
    const now = timeStore.currentTime
    if (!now) return []

    const upcomingParents = _upcomingOverviewEventsBase.value
    const allRelevantEvents: EventData[] = []

    upcomingParents.forEach((parent) => {
      allRelevantEvents.push(parent)
      const children = getChildEvents
        .value(parent.event_name)
        .filter(
          (child) => (child.end && !isNaN(child.end.getTime()) && child.end > now) || !child.start,
        )
      allRelevantEvents.push(...children)
    })

    return allRelevantEvents.sort((a, b) => {
      if (a.start && !b.start) return -1
      if (!a.start && b.start) return 1
      if (!a.start && !b.start) return 0
      return (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0)
    })
  })

  const getUpcomingStructuredEvents: ComputedRef<(count?: number) => EventData[]> = computed(() => {
    return (count?: number) => {
      const fullList = _sortedUpcomingEvents.value
      if (count === undefined || count < 0) {
        return fullList
      }
      return fullList.slice(0, count)
    }
  })

  return {
    isLoading,
    error,
    allEvents,
    eventsByDay,
    detailEventsMap,
    fetchEvents,
    getEventById,
    getEventsForDay,
    getChildEvents,
    sortedDayKeys,
    getUpcomingStructuredEvents,
    upcomingOverviewEvents: _upcomingOverviewEventsBase,
  }
})
