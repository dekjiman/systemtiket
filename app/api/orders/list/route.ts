import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, events, orderItems, tickets, ticketHolders } from '@/lib/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    // In real app, get user from session
    const searchParams = req.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause = eventId ? eq(events.id, eventId) : undefined

    // Fetch orders with event and items
    const ordersList = await db.query.orders.findMany({
      where: whereClause ? sql`${whereClause}` : undefined,
      orderBy: desc(orders.createdAt),
      limit,
      offset,
      with: {
        event: {
          columns: { title: true, venue: true, city: true },
        },
        items: {
          with: {
            ticket: {
              columns: { name: true, price: true },
            },
            holder: {
              columns: { qrCode: true, checkedIn: true },
            },
          },
        },
      },
    }) as unknown as {
      id: string
      totalAmount: number
      status: string
      paidAt: Date | null
      createdAt: Date
      event: { title: string; venue: string; city: string }
      items: { quantity: number; ticket: { name: string; price: number }; holder: { qrCode: string; checkedIn: boolean }[] }[]
    }[]

    // Transform data
    const transformedOrders = ordersList.map(order => ({
      id: order.id,
      eventTitle: order.event.title,
      venue: order.event.venue,
      city: order.event.city,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      paidAt: order.paidAt?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(item => ({
        ticketName: item.ticket.name,
        quantity: item.quantity,
        unitPrice: Number(item.ticket.price),
        qrCodes: item.holder.map(h => ({
          code: h.qrCode,
          checkedIn: h.checkedIn,
        })),
      })),
    }))

    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
