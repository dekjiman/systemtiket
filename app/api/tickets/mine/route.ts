import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { db } from '@/lib/db'
import { orders, orderItems, tickets, events, ticketHolders, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'user') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user's paid orders with ticket holders
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      columns: {
        id: true,
        totalAmount: true,
        status: true,
        paidAt: true,
        createdAt: true,
        eventId: true,
        userId: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.paidAt)],
    })

    const paidOrders = userOrders.filter(order => order.status === 'paid')

    if (paidOrders.length === 0) {
      return NextResponse.json({ tickets: [] })
    }

    // Get user data (in case we need it for display)
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { name: true, email: true, phone: true },
    })

    const orderIds = paidOrders.map(o => o.id)

    // Get order items for these orders
    const allOrderItems = await db.query.orderItems.findMany({
      where: (orderItems, { inArray }) => inArray(orderItems.orderId, orderIds),
    })

    const orderItemIds = allOrderItems.map(item => item.id)
    const ticketIds = allOrderItems.map(item => item.ticketId)

    // Get ticket holders
    const allHolders = await db.query.ticketHolders.findMany({
      where: (ticketHolders, { inArray }) => inArray(ticketHolders.orderItemId, orderItemIds),
    })

    // Get tickets
    const allTickets = await db.query.tickets.findMany({
      where: (tickets, { inArray }) => inArray(tickets.id, ticketIds),
    })

    // Get events
    const eventIds = paidOrders.map(o => o.eventId)
    const allEvents = await db.query.events.findMany({
      where: (events, { inArray }) => inArray(events.id, eventIds),
    })

    // Build ticket list
    const result: any[] = []

    for (const order of paidOrders) {
      const event = allEvents.find(e => e.id === order.eventId)
      const orderItemsList = allOrderItems.filter(item => item.orderId === order.id)

      for (const item of orderItemsList) {
        const ticket = allTickets.find(t => t.id === item.ticketId)
        const holders = allHolders.filter(h => h.orderItemId === item.id)

        for (const holder of holders) {
          // Use user data from database, fallback to session/holder data
          const attendeeName = user?.name || session.user.name || holder.attendeeName || 'Customer'
          const attendeeEmail = user?.email || session.user.email || holder.attendeeEmail || ''
          const attendeePhone = user?.phone || session.user.phone || ''

          result.push({
            id: holder.id,
            orderId: order.id,
            eventTitle: event?.title || 'Unknown Event',
            eventDate: event?.startDate?.toISOString() || '',
            eventVenue: event?.venue || '',
            attendeeName,
            attendeeEmail,
            attendeePhone,
            ticketType: ticket?.name || 'Ticket',
            ticketCode: holder.qrCode,
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(holder.qrCode)}`,
            checkedIn: holder.checkedIn,
            purchasedAt: order.paidAt?.toISOString() || order.createdAt.toISOString(),
          })
        }
      }
    }

    return NextResponse.json({ tickets: result })
  } catch (error) {
    console.error('Error fetching user tickets:', error)
    return NextResponse.json(
      { message: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}