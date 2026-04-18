import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events, tickets } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { ticketTypes } = body

    console.log('Creating tickets for event:', id, 'count:', ticketTypes?.length)

    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (!ticketTypes || !Array.isArray(ticketTypes) || ticketTypes.length === 0) {
      return NextResponse.json(
        { error: 'No ticket types provided' },
        { status: 400 }
      )
    }

    // Delete existing tickets first
    await db.delete(tickets).where(eq(tickets.eventId, id))

    // Build valid tickets array
    const validTickets = ticketTypes
      .filter(t => t.name && t.price && t.quantity)
      .map(t => ({
        eventId: id,
        name: String(t.name).trim(),
        description: String(t.description || '').trim(),
        price: Number(t.price),
        quantity: Number(t.quantity),
        maxPerOrder: Number(t.maxPerOrder) || 4,
        sold: 0,
        isActive: true,
      }))

    console.log('Inserting tickets:', validTickets.length)

    if (validTickets.length > 0) {
      // Insert one by one to avoid any batch issues
      for (const ticket of validTickets) {
        await db.insert(tickets).values(ticket)
      }
    }

    return NextResponse.json({ success: true, count: validTickets.length })
  } catch (error) {
    console.error('Error creating tickets:', error)
    return NextResponse.json(
      { error: 'Failed to create tickets: ' + String(error) },
      { status: 500 }
    )
  }
}