import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { db } from '@/lib/db'
import { tickets, events, organizers, orderItems, orders } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'organizer') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const organizer = await db.query.organizers.findFirst({
      where: eq(organizers.userId, session.user.id),
    })

    if (!organizer) {
      return NextResponse.json(
        { message: 'Organizer not found' },
        { status: 404 }
      )
    }

    const organizerEvents = await db.query.events.findMany({
      where: eq(events.organizerId, organizer.id),
    })

    const eventIds = organizerEvents.map(e => e.id)

    if (eventIds.length === 0) {
      return NextResponse.json({ tickets: [] })
    }

    // Get tickets with their sold count from database
    const organizerTickets = await db.query.tickets.findMany({
      where: (tickets, { inArray }) => inArray(tickets.eventId, eventIds),
      orderBy: [desc(tickets.createdAt)],
    })

    // Get order items to verify sold count
    const relevantOrders = await db.query.orders.findMany({
      where: (orders, { inArray, eq }) => and(
        inArray(orders.eventId, eventIds),
        eq(orders.status, 'paid')
      ),
    })

    const orderIds = relevantOrders.map(o => o.id)

    const orderedItems = orderIds.length > 0 
      ? await db.query.orderItems.findMany({
          where: (orderItems, { inArray }) => inArray(orderItems.orderId, orderIds),
        })
      : []

    // Calculate actual sold from orderItems
    const soldByTicketId: Record<string, number> = {}
    for (const item of orderedItems) {
      soldByTicketId[item.ticketId] = (soldByTicketId[item.ticketId] || 0) + item.quantity
    }

    const result = await Promise.all(
      organizerTickets.map(async (ticket) => {
        const event = await db.query.events.findFirst({
          where: eq(events.id, ticket.eventId),
          columns: { id: true, title: true },
        })

        const actualSold = soldByTicketId[ticket.id] || 0

        return {
          id: ticket.id,
          name: ticket.name,
          price: Number(ticket.price),
          quantity: ticket.quantity,
          sold: actualSold, // Use actual sold from orderItems
          dbSold: ticket.sold, // Original sold from tickets table
          isActive: ticket.isActive,
          eventId: ticket.eventId,
          eventTitle: event?.title || 'Unknown Event',
        }
      })
    )

    return NextResponse.json({ tickets: result, debug: { eventCount: eventIds.length, ticketTypes: organizerTickets.length, ordersCount: relevantOrders.length, itemsCount: orderedItems.length } })
  } catch (error) {
    console.error('Error fetching organizer tickets:', error)
    return NextResponse.json(
      { message: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}