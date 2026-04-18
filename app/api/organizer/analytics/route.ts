import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { db } from '@/lib/db'
import { events, tickets, orderItems, orders, ticketHolders, organizers } from '@/lib/schema'
import { eq, inArray, desc } from 'drizzle-orm'

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
      return NextResponse.json({
        totalEvents: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
        totalAttendees: 0,
        events: [],
      })
    }

    const eventsList = await db.query.events.findMany({
      where: eq(events.organizerId, organizer.id),
      orderBy: desc(events.createdAt),
      columns: {
        id: true,
        title: true,
        startDate: true,
        status: true,
        totalCapacity: true,
      },
    })

    if (eventsList.length === 0) {
      return NextResponse.json({
        totalEvents: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
        totalAttendees: 0,
        events: [],
      })
    }

    const eventIds = eventsList.map(e => e.id)

    const allTickets = await db.query.tickets.findMany({
      where: inArray(tickets.eventId, eventIds),
    })

    const eventOrders = await db.query.orders.findMany({
      where: inArray(orders.eventId, eventIds),
    })

    const paidOrders = eventOrders.filter(o => o.status === 'paid')
    const orderIds = paidOrders.map(o => o.id)

    const allOrderItems = orderIds.length > 0
      ? await db.query.orderItems.findMany({
          where: inArray(orderItems.orderId, orderIds),
        })
      : []

    const orderItemIds = allOrderItems.map(i => i.id)
    const allHolders = orderItemIds.length > 0
      ? await db.query.ticketHolders.findMany({
          where: inArray(ticketHolders.orderItemId, orderItemIds),
        })
      : []

    const totalTicketsSold = allTickets.reduce((sum, t) => sum + Number(t.sold), 0)
    const totalRevenue = allOrderItems.reduce((sum, i) => sum + Number(i.subtotal), 0)
    const totalAttendees = allHolders.length

    const eventOrdersMap = new Map<string, typeof paidOrders>()
    for (const order of paidOrders) {
      const existing = eventOrdersMap.get(order.eventId) || []
      existing.push(order)
      eventOrdersMap.set(order.eventId, existing)
    }

    const eventStats = eventsList.map(event => {
      const eventTicketList = allTickets.filter(t => t.eventId === event.id)
      const ticketsSold = eventTicketList.reduce((sum, t) => sum + Number(t.sold), 0)

      const eventOrderList = eventOrdersMap.get(event.id) || []
      const eventOrderIds = eventOrderList.map(o => o.id)
      const eventOrderItems = allOrderItems.filter(i => eventOrderIds.includes(i.id))
      const revenue = eventOrderItems.reduce((sum, i) => sum + Number(i.subtotal), 0)

      return {
        id: event.id,
        title: event.title,
        startDate: event.startDate.toISOString(),
        status: event.status,
        ticketsSold,
        revenue,
        capacity: event.totalCapacity,
      }
    })

    return NextResponse.json({
      totalEvents: eventsList.length,
      totalTicketsSold,
      totalRevenue,
      totalAttendees,
      events: eventStats,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { message: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}