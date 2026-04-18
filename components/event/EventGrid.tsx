'use client'

import { useEffect, useState } from 'react'
import { EventCard, type EventCardProps } from './EventCard'

interface ApiEvent {
  id: string
  title: string
  description?: string
  poster?: string
  venue: string
  city: string
  startDate: string
  endDate?: string
  status: string
  slug: string
  price: number
  tickets: { id: string; name: string; price: number; available: number }[]
  organizer: { id: string; organizationName: string }
}

interface EventGridProps {
  filters?: {
    city?: string
    genre?: string
    date?: string
  }
}

type EventItem = EventCardProps['event']

export function EventGrid({ filters }: EventGridProps) {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const params = new URLSearchParams()
        if (filters?.city) params.append('city', filters.city)
        if (filters?.genre) params.append('genre', filters.genre)
        if (filters?.date) params.append('date', filters.date)

        const response = await fetch(`/api/events?${params}`)
        const data = await response.json()
        
        // Transform API response to match EventCard interface
        const transformedEvents: EventItem[] = (data.events || []).map((event: ApiEvent) => {
          const startDate = new Date(event.startDate)
          return {
            id: event.id,
            slug: event.slug,
            title: event.title,
            artist: event.organizer?.organizationName || 'JustMine',
            date: event.startDate,
            time: startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            venue: event.venue,
            city: event.city,
            price: event.price,
            poster: event.poster || undefined,
            soldOut: event.tickets?.every(t => t.available === 0) || false,
            tags: event.tickets?.map(t => t.name) || [],
          }
        })
        
        setEvents(transformedEvents)
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [filters])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/5] bg-dark-800 rounded-t-lg" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-dark-800 rounded w-1/3" />
              <div className="h-6 bg-dark-800 rounded w-3/4" />
              <div className="h-4 bg-dark-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary text-lg">No events found matching your criteria</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
