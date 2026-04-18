import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { db } from '@/lib/db'
import { events, tickets, organizers } from '@/lib/schema'
import { eq, and, or, like } from 'drizzle-orm'
import { EventDetailClient } from '@/components/event/EventDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  
  const whereClause = isValidUUID(id) 
    ? or(eq(events.id, id), eq(events.slug, id))
    : eq(events.slug, id)
  
  const event = await db.query.events.findFirst({
    where: whereClause,
    columns: { title: true, description: true }
  })
  
  return {
    title: event?.title ? `${event.title} - JustMine` : 'Event - JustMine',
    description: event?.description || 'Get your tickets for this amazing event',
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params

  const whereClause = isValidUUID(id) 
    ? or(eq(events.id, id), eq(events.slug, id))
    : eq(events.slug, id)

  const event = await db.query.events.findFirst({
    where: whereClause,
    columns: {
      id: true,
      title: true,
      description: true,
      posterUrl: true,
      venue: true,
      address: true,
      city: true,
      startDate: true,
      endDate: true,
      status: true,
      organizerId: true,
      lineup: true,
      rundown: true,
      venueMapUrl: true,
      venueLatitude: true,
      venueLongitude: true,
    },
  })

  if (!event) {
    notFound()
  }

  const eventTickets = await db.query.tickets.findMany({
    where: eq(tickets.eventId, event.id),
  })

  const organizer = await db.query.organizers.findFirst({
    where: eq(organizers.id, event.organizerId),
    columns: { id: true, organizationName: true },
  })

  const parseJsonField = <T,>(str: string | null | undefined): T | null => {
    if (!str) return null
    try {
      return JSON.parse(str) as T
    } catch {
      return null
    }
  }

  const eventData = {
    id: event.id,
    title: event.title,
    description: event.description || undefined,
    posterUrl: event.posterUrl || undefined,
    venue: event.venue,
    address: event.address,
    city: event.city,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() || undefined,
    status: event.status,
    organizer: organizer || { id: '', organizationName: 'JustMine' },
    tickets: eventTickets.filter(t => t.isActive).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || undefined,
      price: Number(t.price),
      quantity: t.quantity,
      sold: t.sold,
      maxPerOrder: t.maxPerOrder,
      isActive: t.isActive,
    })),
    lineup: parseJsonField<{ name: string; role: string; imageUrl: string }[]>(event.lineup),
    rundown: parseJsonField<{ date: string; time: string; activity: string; description: string }[]>(event.rundown),
    venueMapUrl: event.venueMapUrl || undefined,
    venueLatitude: event.venueLatitude || undefined,
    venueLongitude: event.venueLongitude || undefined,
  }

  return <EventDetailClient event={eventData} />
}
