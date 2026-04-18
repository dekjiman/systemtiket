import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events, organizers, tickets } from '@/lib/schema'
import { eq, or } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch event with organizer and tickets - support both ID and slug
    const event = await db.query.events.findFirst({
      where: or(eq(events.id, id), eq(events.slug, id)),
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
    }) as unknown as {
      id: string
      title: string
      description: string | null
      posterUrl: string | null
      venue: string
      address: string
      city: string
      startDate: Date
      endDate: Date | null
      status: string
      organizerId: string
      lineup: string | null
      rundown: string | null
      venueMapUrl: string | null
      venueLatitude: string | null
      venueLongitude: string | null
    } | null

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const eventTickets = await db.query.tickets.findMany({
      where: eq(tickets.eventId, event.id),
    })

    const organizer = await db.query.organizers.findFirst({
      where: eq(organizers.id, event.organizerId),
      columns: { id: true, organizationName: true },
    })

    // Transform data for frontend
    const eventData = {
      id: event.id,
      title: event.title,
      description: event.description,
      posterUrl: event.posterUrl || null,
      venue: event.venue,
      address: event.address,
      city: event.city,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString(),
      status: event.status,
      organizer: {
        id: organizer?.id || '',
        organizationName: organizer?.organizationName || 'JustMine',
      },
      tickets: eventTickets.filter(t => t.isActive).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        price: Number(t.price),
        quantity: t.quantity,
        sold: t.sold,
        maxPerOrder: t.maxPerOrder,
        isActive: t.isActive,
      })),
      lineup: event.lineup,
      rundown: event.rundown,
      venueMapUrl: event.venueMapUrl,
      venueLatitude: event.venueLatitude,
      venueLongitude: event.venueLongitude,
    }

    return NextResponse.json(eventData)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      title,
      description,
      venue,
      address,
      city,
      startDate,
      startTime,
      endDate,
      endTime,
      posterUrl,
      venueMapUrl,
      venueLatitude,
      venueLongitude,
      ticketTypes,
      lineup,
      rundown,
    } = body

    // Check if event exists
    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, id),
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Build update values
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (venue !== undefined) updateData.venue = venue
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (posterUrl !== undefined) updateData.posterUrl = posterUrl
    if (venueMapUrl !== undefined) updateData.venueMapUrl = venueMapUrl
    if (venueLatitude !== undefined) updateData.venueLatitude = venueLatitude
    if (venueLongitude !== undefined) updateData.venueLongitude = venueLongitude

    // Handle dates
    if (startDate && startTime) {
      updateData.startDate = new Date(`${startDate}T${startTime}`)
    }
    if (endDate && endTime) {
      updateData.endDate = new Date(`${endDate}T${endTime}`)
    }

    // Handle lineup and rundown (stored as JSON)
    if (lineup !== undefined) {
      updateData.lineup = JSON.stringify(lineup.filter((a: any) => a.name))
    }
    if (rundown !== undefined) {
      updateData.rundown = JSON.stringify(rundown.filter((r: any) => r.time && r.activity))
    }

    // Update event
    await db.update(events)
      .set(updateData)
      .where(eq(events.id, id))

    // Handle ticket types - delete existing and recreate
    if (ticketTypes && Array.isArray(ticketTypes)) {
      // Delete existing tickets
      await db.delete(tickets).where(eq(tickets.eventId, id))

      // Insert new tickets
      const validTickets = ticketTypes.filter((t: any) => t.name && t.price && t.quantity)
      if (validTickets.length > 0) {
        await db.insert(tickets).values(
          validTickets.map((t: any) => ({
            id: randomUUID(),
            eventId: id,
            name: t.name,
            description: t.description || '',
            price: Number(t.price),
            quantity: Number(t.quantity),
            maxPerOrder: Number(t.maxPerOrder) || 4,
            isActive: true,
          }))
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { lineup, rundown, venueMapUrl, venueLatitude, venueLongitude, venue, address, city } = body

    // Check if event exists
    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, id),
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Build update values
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (lineup !== undefined) {
      updateData.lineup = lineup ? JSON.stringify(lineup.filter((a: any) => a.name)) : null
    }
    if (rundown !== undefined) {
      updateData.rundown = rundown ? JSON.stringify(rundown.filter((r: any) => r.time && r.activity)) : null
    }
    if (venueMapUrl !== undefined) updateData.venueMapUrl = venueMapUrl || null
    if (venueLatitude !== undefined) updateData.venueLatitude = venueLatitude || null
    if (venueLongitude !== undefined) updateData.venueLongitude = venueLongitude || null
    if (venue !== undefined) updateData.venue = venue
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city

    // Update event
    await db.update(events)
      .set(updateData)
      .where(eq(events.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error patching event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}
