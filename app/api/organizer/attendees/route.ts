import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { db } from '@/lib/db'
import { ticketHolders, orderItems, tickets, events, orders, organizers, users } from '@/lib/schema'
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
      return NextResponse.json({ attendees: [] })
    }

    const eventOrders = await db.query.orders.findMany({
      where: (orders, { inArray }) => inArray(orders.eventId, eventIds),
      columns: { id: true, eventId: true, paidAt: true, createdAt: true, userId: true },
    })

    const orderIds = eventOrders.map(o => o.id)
    const userIds = [...new Set(eventOrders.map(o => o.userId).filter(Boolean))]

    if (orderIds.length === 0) {
      return NextResponse.json({ attendees: [] })
    }

    // Get user data
    const allUsers = userIds.length > 0 
      ? await db.query.users.findMany({
          where: (users, { inArray }) => inArray(users.id, userIds),
          columns: { id: true, name: true, email: true, phone: true },
        })
      : []

    const allOrderItems = await db.query.orderItems.findMany({
      where: (orderItems, { inArray }) => inArray(orderItems.orderId, orderIds),
    })

    const orderItemIds = allOrderItems.map(oi => oi.id)
    const ticketIds = allOrderItems.map(oi => oi.ticketId)

    const allHolders = await db.query.ticketHolders.findMany({
      where: (ticketHolders, { inArray }) => inArray(ticketHolders.orderItemId, orderItemIds),
    })

    const allTickets = await db.query.tickets.findMany({
      where: (tickets, { inArray }) => inArray(tickets.id, ticketIds),
    })

    const result = await Promise.all(
      allHolders.map(async (holder) => {
        const orderItem = allOrderItems.find(oi => oi.id === holder.orderItemId)
        const ticket = allTickets.find(t => t.id === orderItem?.ticketId)
        const order = eventOrders.find(o => o.id === orderItem?.orderId)
        const event = organizerEvents.find(e => e.id === order?.eventId)
        
        // Get user data from orders table
        const user = order?.userId ? allUsers.find(u => u.id === order.userId) : null
        
        // Use user data, fallback to ticketHolder data (for backwards compatibility)
        const attendeeName = user?.name || holder.attendeeName || 'Customer'
        const attendeeEmail = user?.email || holder.attendeeEmail || 'customer@example.com'
        const attendeePhone = user?.phone || ''

        return {
          id: holder.id,
          attendeeName,
          attendeeEmail,
          attendeePhone,
          ticketType: ticket?.name || 'Ticket',
          eventTitle: event?.title || 'Unknown Event',
          eventId: order?.eventId || '',
          checkedIn: holder.checkedIn,
          checkedInAt: holder.checkedInAt?.toISOString() || null,
          qrCode: holder.qrCode,
          purchaseDate: order?.paidAt?.toISOString() || order?.createdAt.toISOString() || '',
        }
      })
    )

    return NextResponse.json({ attendees: result })
  } catch (error) {
    console.error('Error fetching attendees:', error)
    return NextResponse.json(
      { message: 'Failed to fetch attendees' },
      { status: 500 }
    )
  }
}