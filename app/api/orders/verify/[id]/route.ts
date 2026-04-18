import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems, tickets, events, ticketHolders, users } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

const MIDTRANS_BASE_URL = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://api.midtrans.com'
  : 'https://api.sandbox.midtrans.com'

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || ''

// Verify payment status with Midtrans
async function verifyMidtransPayment(orderId: string): Promise<{
  status: string
  transactionStatus: string
}> {
  const authHeader = `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')}`
  
  try {
    const response = await fetch(`${MIDTRANS_BASE_URL}/v2/${orderId}/status`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        status: data.transaction_status,
        transactionStatus: data.transaction_status,
      }
    }
  } catch (error) {
    console.error('Midtrans verification error:', error)
  }

  return { status: 'unknown', transactionStatus: 'unknown' }
}

// GET - Verify payment status and get QR codes
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Get order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      )
    }

    // If order is already paid, return success immediately
    if (order.status === 'paid') {
      // Get QR codes
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId),
      })

      const qrCodes: { itemId: string; ticketName: string; qrCode: string; quantity: number }[] = []

      for (const item of items) {
        const holders = await db.query.ticketHolders.findMany({
          where: eq(ticketHolders.orderItemId, item.id),
        })

        const ticket = await db.query.tickets.findFirst({
          where: eq(tickets.id, item.ticketId),
        })

        qrCodes.push({
          itemId: item.id,
          ticketName: ticket?.name || 'Ticket',
          quantity: item.quantity,
          qrCode: holders.map(h => h.qrCode).join(','),
        })
      }

      return NextResponse.json({
        status: 'paid',
        orderId: order.id,
        totalAmount: order.totalAmount,
        qrCodes,
      })
    }

    // If order is pending or cancelled, verify with Midtrans
    if (order.status === 'pending') {
      const midtransStatus = await verifyMidtransPayment(orderId)

      // If Midtrans says success, update order
      if (midtransStatus.transactionStatus === 'settlement' || 
          midtransStatus.transactionStatus === 'capture') {
        
        // Get user info for ticket holders
        const user = await db.query.users.findFirst({
          where: eq(users.id, order.userId),
          columns: { name: true, email: true, phone: true },
        })
        
        const userName = user?.name || 'Customer'
        const userEmail = user?.email || 'customer@example.com'
        const userPhone = user?.phone || ''

        // Generate QR codes
        const items = await db.query.orderItems.findMany({
          where: eq(orderItems.orderId, orderId),
        })

        await db.transaction(async (tx) => {
          // Update order status
          await tx
            .update(orders)
            .set({ status: 'paid', paidAt: new Date() })
            .where(eq(orders.id, orderId))

          // Generate QR codes
          for (const item of items) {
            for (let i = 0; i < item.quantity; i++) {
              const qrCode = crypto.randomUUID ? crypto.randomUUID() : 
                Math.random().toString(36).substring(2, 34)
              
              await tx.insert(ticketHolders).values({
                orderItemId: item.id,
                qrCode,
                attendeeName: userName,
                attendeeEmail: userEmail,
              })
            }
          }
        })

        // Get updated QR codes
        const updatedItems = await db.query.orderItems.findMany({
          where: eq(orderItems.orderId, orderId),
        })

        const qrCodes: { itemId: string; ticketName: string; qrCode: string; quantity: number }[] = []

        for (const item of updatedItems) {
          const holders = await db.query.ticketHolders.findMany({
            where: eq(ticketHolders.orderItemId, item.id),
          })

          const ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, item.ticketId),
          })

          qrCodes.push({
            itemId: item.id,
            ticketName: ticket?.name || 'Ticket',
            quantity: item.quantity,
            qrCode: holders.map(h => h.qrCode).join(','),
          })
        }

        return NextResponse.json({
          status: 'paid',
          orderId: order.id,
          totalAmount: order.totalAmount,
          qrCodes,
        })
      }

      // Payment still pending
      return NextResponse.json({
        status: 'pending',
        orderId: order.id,
        midtransStatus: midtransStatus.transactionStatus,
      })
    }

    // Order is cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json({
        status: 'cancelled',
        orderId: order.id,
        message: 'Order was cancelled by user',
      })
    }

    return NextResponse.json({
      status: order.status,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Error verifying order:', error)
    return NextResponse.json(
      { message: 'Failed to verify order' },
      { status: 500 }
    )
  }
}