import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { db } from '@/lib/db'
import { events, tickets, organizers, orderItems, orders } from '@/lib/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    const status = searchParams.get('status') || 'published'
    const organizerView = searchParams.get('organizer') === 'true'

    // Get organizer ID if user is an organizer
    let organizerId: string | null = null
    if (session?.user?.role === 'organizer' && session.user.id) {
      const organizer = await db.query.organizers.findFirst({
        where: eq(organizers.userId, session.user.id),
        columns: { id: true },
      })
      organizerId = organizer?.id || null
    }

    // Build query conditions
    const conditions: any[] = [eq(events.status, status as 'published' | 'draft' | 'completed' | 'cancelled')]
    if (city) {
      conditions.push(eq(events.city, city))
    }
    if (organizerView && organizerId) {
      conditions.push(eq(events.organizerId, organizerId))
    }

    // Fetch events
    const eventsList = await db.query.events.findMany({
      where: and(...conditions),
      orderBy: desc(events.startDate),
      columns: {
        id: true,
        title: true,
        description: true,
        posterUrl: true,
        venue: true,
        city: true,
        startDate: true,
        endDate: true,
        status: true,
        slug: true,
        organizerId: true,
      },
    }) as unknown as {
      id: string
      title: string
      description: string | null
      posterUrl: string | null
      venue: string
      city: string
      startDate: Date
      endDate: Date | null
      status: string
      slug: string
      organizerId: string
    }[]

    // Fetch tickets and calculate actual sold from orderItems
    const eventIds = eventsList.map(e => e.id)
    
    // Get all paid orders for these events
    const paidOrders = eventIds.length > 0 
      ? await db.query.orders.findMany({
          where: (orders, { inArray, eq }) => and(
            inArray(orders.eventId, eventIds),
            eq(orders.status, 'paid')
          ),
        })
      : []
    
    const orderIds = paidOrders.map(o => o.id)
    
    // Get all order items
    const allOrderItems = orderIds.length > 0
      ? await db.query.orderItems.findMany({
          where: (orderItems, { inArray }) => inArray(orderItems.orderId, orderIds),
        })
      : []

    // Calculate sold by ticketId
    const soldByTicketId: Record<string, number> = {}
    for (const item of allOrderItems) {
      soldByTicketId[item.ticketId] = (soldByTicketId[item.ticketId] || 0) + item.quantity
    }

    // Get all tickets
    const allTickets: { eventId: string; id: string; name: string; price: number; quantity: number }[] = []
    for (const eventId of eventIds) {
      const eventTickets = await db.query.tickets.findMany({
        where: and(eq(tickets.eventId, eventId), eq(tickets.isActive, true)),
        columns: { id: true, name: true, price: true, quantity: true },
      })
      allTickets.push(...eventTickets.map(t => ({ ...t, eventId })))
    }
    
    const organizerIds = [...new Set(eventsList.map(e => e.organizerId))]
    const allOrganizers: { id: string; organizationName: string }[] = []
    for (const orgId of organizerIds) {
      const org = await db.query.organizers.findFirst({
        where: eq(organizers.id, orgId),
        columns: { id: true, organizationName: true },
      })
      if (org) allOrganizers.push(org)
    }

    // Transform to frontend format
    const transformedEvents = eventsList.map(event => {
      const eventTickets = allTickets.filter(t => t.eventId === event.id)
      const minPrice = eventTickets.length > 0
        ? Math.min(...eventTickets.map(t => Number(t.price)))
        : 0
      const organizer = allOrganizers.find(o => o.id === event.organizerId)

      const ticketsSold = eventTickets.reduce((sum, t) => sum + (soldByTicketId[t.id] || 0), 0)
      const revenue = eventTickets.reduce((sum, t) => sum + (Number(t.price) * (soldByTicketId[t.id] || 0)), 0)

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        poster: event.posterUrl ? (event.posterUrl.startsWith('http') ? event.posterUrl : event.posterUrl) : null,
        venue: event.venue,
        city: event.city,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() || null,
        status: event.status,
        slug: event.slug,
        price: minPrice,
        ticketsSold,
        revenue,
        tickets: eventTickets.map(t => ({
          id: t.id,
          name: t.name,
          price: Number(t.price),
          available: t.quantity - (soldByTicketId[t.id] || 0),
        })),
        organizer: organizer ? {
          id: organizer.id,
          organizationName: organizer.organizationName,
        } : null,
      }
    })

    return NextResponse.json({ events: transformedEvents })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      title,
      description,
      venue,
      address,
      city,
      startDate,
      endDate,
      posterUrl,
      ticketTypes,
      lineup,
      rundown,
      venueMapUrl,
      venueLatitude,
      venueLongitude,
    } = body

    // Validation
    if (!title || !venue || !address || !city || !startDate) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

  // Get organizer (for now, use first one - would come from auth session)
  const organizer = await db.query.organizers.findFirst()

    if (!organizer) {
      return NextResponse.json(
        { message: 'Organizer not found' },
        { status: 400 }
      )
    }

    // Create slug
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + createId().slice(0, 8)

    // Create event
    const [event] = await db.insert(events).values({
      organizerId: organizer.id,
      title,
      description,
      posterUrl,
      venue,
      address,
      city,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: 'draft',
      slug,
      lineup: lineup ? JSON.stringify(lineup) : null,
      rundown: rundown ? JSON.stringify(rundown) : null,
      venueMapUrl: venueMapUrl || null,
      venueLatitude: venueLatitude || null,
      venueLongitude: venueLongitude || null,
    }).returning()

    // Create ticket types
    if (ticketTypes && Array.isArray(ticketTypes)) {
      for (const ticket of ticketTypes) {
        await db.insert(tickets).values({
          eventId: event.id,
          name: ticket.name,
          description: ticket.description || '',
          price: ticket.price,
          quantity: ticket.quantity,
          maxPerOrder: ticket.maxPerOrder || 4,
          saleStart: new Date(),
          isActive: true,
        })
      }
    }

    // Auto-publish (or keep draft based on requirement)
    await db
      .update(events)
      .set({ status: 'published' })
      .where(eq(events.id, event.id))

    return NextResponse.json({
      message: 'Event created successfully',
      eventId: event.id,
      slug: event.slug,
    })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { message: 'Failed to create event' },
      { status: 500 }
    )
  }
}
