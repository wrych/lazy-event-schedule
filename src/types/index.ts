export interface EventData {
  id: string // Added during processing
  start_datetime: string | null
  end_datetime: string | null
  location: string
  event_name: string
  event_description: string
  type: 'overview' | 'detail'
  parent_event: string | null

  // Processed fields
  start: Date | null
  end: Date | null
}

// Interface for raw event data before processing
export interface RawEventData extends Omit<EventData, 'id' | 'start' | 'end'> {}

export interface EventsByDay {
  [dayKey: string]: EventData[] // Key is 'YYYY-MM-DD'
}

export interface DetailEventsMap extends Map<string, EventData[]> {
  // Key is parent event name
}
