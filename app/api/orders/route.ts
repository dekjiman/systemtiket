import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { db } from '@/lib/db'
import { orders, orderItems, tickets, events, ticketHolders, carts, cartItems, notifications, users } from '@/lib/schema'
import { eq, and, inArray } from 'drizzle-orm'
import redis, {
  lockTicket,
  unlockTicket,
  checkRateLimit,
  decrementTicketStock,
  incrementTicketStock,
} from '@/lib/redis'
import { sql } from 'drizzle-orm'

// Midtrans configuration
const MIDTRANS_BASE_URL = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://app.midtrans.com'
  : 'https://app.sandbox.midtrans.com'

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || ''

async function generateSnapToken(orderId: string, totalAmount: number, customerInfo: any, eventTitle?: string, ticketItems?: any[], serviceFee?: number) {
  console.log('generateSnapToken called:', { orderId, totalAmount, eventTitle, ticketItems, serviceFee })
  console.log('MIDTRANS_BASE_URL:', MIDTRANS_BASE_URL)
  console.log('MIDTRANS_SERVER_KEY present:', !!MIDTRANS_SERVER_KEY)
  
  const itemDetails = ticketItems?.map((item: any) => ({
    id: item.ticketId,
    name: eventTitle ? `${eventTitle} - ${item.ticketName}` : item.ticketName,
    price: item.price,
    quantity: item.quantity,
  })) || []

  // Add service fee as item if present
  if (serviceFee && serviceFee > 0) {
    itemDetails.push({
      id: 'service_fee',
      name: 'Service Fee',
      price: serviceFee,
      quantity: 1,
    })
  }

  const midtransBody: any = {
    transaction_details: {
      order_id: orderId,
      gross_amount: totalAmount,
    },
    customer_details: {
      first_name: customerInfo.fullName?.split(' ')[0] || 'Customer',
      last_name: customerInfo.fullName?.split(' ').slice(1).join(' ') || '',
      email: customerInfo.email,
      phone: customerInfo.phone,
    },
    callbacks: {
      finish: `${process.env.NEXTAUTH_URL}/checkout/success?order_id=${orderId}&status=success`,
      error: `${process.env.NEXTAUTH_URL}/checkout/success?order_id=${orderId}&status=error`,
      cancel: `${process.env.NEXTAUTH_URL}/checkout/success?order_id=${orderId}&status=cancelled`,
    },
  }

  if (itemDetails.length > 0) {
    midtransBody.item_details = itemDetails
  }

  console.log('Sending to Midtrans:', JSON.stringify(midtransBody, null, 2))

  const midtransResponse = await fetch(`${MIDTRANS_BASE_URL}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(midtransBody),
  })

  console.log('Midtrans response status:', midtransResponse.status)
  
  if (midtransResponse.ok) {
    const paymentData = await midtransResponse.json()
    console.log('Midtrans success, token received')
    return paymentData.token
  }
  
  const errorText = await midtransResponse.text()
  console.error('Midtrans error response:', errorText)
  return null
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Please login to place an order' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await req.json()
    const { ticketItems, customerInfo, paymentMethod } = body

    // Rate limiting - max 5 checkout requests per minute
    const canProceed = await checkRateLimit(userId, 'checkout', 5, 60)
    if (!canProceed) {
      return NextResponse.json(
        { message: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    // Validate
    if (!ticketItems || ticketItems.length === 0) {
      return NextResponse.json(
        { message: 'No ticketItems in order' },
        { status: 400 }
      )
    }

    // Get user's active cart
    const cart = await db.query.carts.findFirst({
      where: and(
        eq(carts.userId, userId),
        eq(carts.status, 'active')
      ),
    })

    if (!cart) {
      console.error('Cart not found for user:', userId)
      return NextResponse.json(
        { message: 'Cart not found. Please add tickets to your cart first.' },
        { status: 400 }
      )
    }

    // Check if cart has expired
    if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
      console.error('Cart expired for user:', userId)
      await db.update(carts)
        .set({ status: 'expired' })
        .where(eq(carts.id, cart.id))
      return NextResponse.json(
        { message: 'Your cart has expired. Please add tickets to your cart again.' },
        { status: 400 }
      )
    }

    // Get cart ticketItems
    const cartItemsList = await db.query.cartItems.findMany({
      where: eq(cartItems.cartId, cart.id),
    })

    if (cartItemsList.length === 0) {
      console.error('Cart is empty for user:', userId)
      return NextResponse.json(
        { message: 'Your cart is empty. Please add tickets first.' },
        { status: 400 }
      )
    }

    // Verify all ticketItems exist in cart
    const requestedTicketIds = ticketItems.map((i: any) => i.ticketId)
    const cartTicketMap = new Map(cartItemsList.map(ci => [ci.ticketId, ci]))

    // Verify ticket availability and calculate total
    let totalAmount = 0
    const ticketValidations: { ticketId: string; ticketName: string; ticket: { id: string; name: string; price: number; sold: number; eventId: string }; requested: number }[] = []

    for (const item of ticketItems) {
      const cartItem = cartTicketMap.get(item.ticketId)
      
      if (!cartItem || cartItem.quantity !== item.quantity) {
        return NextResponse.json(
          { message: `Ticket quantity mismatch: ${item.ticketId}` },
          { status: 400 }
        )
      }

      const ticket = await db.query.tickets.findFirst({
        where: and(
          eq(tickets.id, item.ticketId),
          eq(tickets.isActive, true)
        ),
        columns: {
          id: true,
          name: true,
          price: true,
          sold: true,
          eventId: true,
          quantity: true,
        },
      })

      if (!ticket) {
        return NextResponse.json(
          { message: `Invalid ticket: ${item.ticketId}` },
          { status: 400 }
        )
      }

      const available = ticket.quantity - ticket.sold
      if (available < item.quantity) {
        return NextResponse.json(
          { message: `Not enough tickets available for ${ticket.name}` },
          { status: 400 }
        )
      }

      totalAmount += Number(ticket.price) * item.quantity
      ticketValidations.push({ ticketId: ticket.id, ticketName: item.ticketName || ticket.name, ticket, requested: item.quantity })
    }

    // Get the primary event (first ticket's event)
    const primaryEventId = ticketValidations[0]?.ticket.eventId || cartItemsList[0]?.eventId

    if (!primaryEventId) {
      return NextResponse.json(
        { message: 'No event found' },
        { status: 400 }
      )
    }

    // Add service fee
    const serviceFee = Math.round(totalAmount * 0.03)
    totalAmount += serviceFee

    // Try to lock all tickets before creating order
    const lockResults = []
    for (const { ticketId } of ticketItems) {
      const locked = await lockTicket(ticketId, userId)
      lockResults.push({ ticketId, locked })
    }

    // Check if all tickets could be locked
    const failedLocks = lockResults.filter(r => !r.locked)
    if (failedLocks.length > 0) {
      // Release any locks we got
      for (const { ticketId } of lockResults) {
        await unlockTicket(ticketId, userId).catch(console.error)
      }
      return NextResponse.json(
        { message: 'Some tickets are being reserved by other users. Please try again.' },
        { status: 409 }
      )
    }

    // Store ticket IDs for error handling
    const ticketIds = ticketItems.map((i: any) => i.ticketId)

    // Create order in transaction
    const order = await db.transaction(async (tx) => {
      // Create order with pending status
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId: userId,
          eventId: primaryEventId,
          totalAmount,
          status: 'pending',
          paymentMethod: 'midtrans',
        })
        .returning()

      // Reserve tickets - update sold count with optimistic locking
      for (const { ticketId, ticket, requested } of ticketValidations as { ticketId: string; ticket: { id: string; name: string; price: number; sold: number }; requested: number }[]) {
        // Use SQL for atomic update
        const [updated] = await tx
          .update(tickets)
          .set({ sold: sql`sold + ${requested}` })
          .where(and(
            eq(tickets.id, ticketId),
            sql`sold + ${requested} <= quantity`
          ))
          .returning()

        if (!updated) {
          throw new Error(`Not enough tickets available for ${ticket.name}`)
        }

        await tx
          .insert(orderItems)
          .values({
            orderId: newOrder.id,
            ticketId: ticketId,
            quantity: requested,
            unitPrice: ticket.price,
            subtotal: Number(ticket.price) * requested,
          })
      }

      return newOrder
    })

    // Release locks after successful order creation
    for (const { ticketId } of ticketItems) {
      await unlockTicket(ticketId, userId).catch(console.error)
    }

    // Generate Snap token for popup
    let snapToken = null

    // Get event title for Midtrans
    const event = await db.query.events.findFirst({
      where: eq(events.id, primaryEventId),
      columns: { title: true },
    })

    if (!event) {
      console.error('Event not found:', primaryEventId)
      // Rollback - restore ticket availability
      await db.transaction(async (tx) => {
        for (const { ticketId, requested } of ticketValidations as { ticketId: string; requested: number }[]) {
          await tx
            .update(tickets)
            .set({ sold: sql`sold - ${requested}` })
            .where(eq(tickets.id, ticketId))
        }
        await tx
          .delete(orders)
          .where(eq(orders.id, order.id))
      })
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 500 }
      )
    }

    // Prepare ticket items for Midtrans
    const midtransItems = ticketValidations.map((v: any) => ({
      ticketId: v.ticketId,
      ticketName: v.ticketName,
      price: Number(v.ticket.price),
      quantity: v.requested,
    }))

    console.log('Midtrans items:', JSON.stringify(midtransItems))
    console.log('Service fee:', serviceFee)
    console.log('Total amount:', totalAmount)

    // Always use Midtrans for now (payment method selector is hidden)
    snapToken = await generateSnapToken(order.id, totalAmount, customerInfo, event?.title, midtransItems, serviceFee)
    
    if (!snapToken) {
      // Rollback - restore ticket availability
      await db.transaction(async (tx) => {
        for (const { ticket, requested } of ticketValidations as { ticket: { id: string; price: number; sold: number }; requested: number }[]) {
          await tx
            .update(tickets)
            .set({ sold: ticket.sold - requested })
            .where(eq(tickets.id, ticket.id))
        }
        await tx
          .delete(orders)
          .where(eq(orders.id, order.id))
      })
      
      return NextResponse.json(
        { message: 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    // Clear the cart after successful order creation
    if (cart) {
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))
      await db.update(carts)
        .set({ status: 'checkout' })
        .where(eq(carts.id, cart.id))
    }

    return NextResponse.json({
      message: 'Order created successfully',
      orderId: order.id,
      snapToken,
      totalAmount,
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

// Handle payment status updates (called from success page or webhook)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { message: 'Missing orderId or status' },
        { status: 400 }
      )
    }

    // Get order with ticketItems
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      )
    }

    // Get orderItems for this order
    const orderItemsList = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    })

    // Get user info from order
    const orderUserId = order.userId

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, orderUserId),
      columns: { name: true, email: true },
    })

    const userName = user?.name || 'Customer'
    const userEmail = user?.email || 'customer@example.com'

    const ticketValidations: { ticketId: string; quantity: number; ticketName: string }[] = []
    for (const item of orderItemsList) {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, item.ticketId),
        columns: { id: true, name: true },
      })
      if (ticket) {
        ticketValidations.push({ ticketId: ticket.id, quantity: item.quantity, ticketName: ticket.name })
      }
    }

    // Handle based on status
    if (status === 'success' || status === 'paid') {
      // Payment successful - generate QR codes
      await db.transaction(async (tx) => {
        // Update order status to paid
        await tx
          .update(orders)
          .set({ status: 'paid', paidAt: new Date() })
          .where(eq(orders.id, orderId))

        // Generate ticket holders with QR codes (only if not already generated)
        for (const item of orderItemsList) {
          const existingHolders = await tx.query.ticketHolders.findMany({
            where: eq(ticketHolders.orderItemId, item.id),
          })
          
          // Only create if none exist
          if (existingHolders.length === 0) {
            for (let i = 0; i < item.quantity; i++) {
              const qrCode = crypto.randomUUID()
              await tx.insert(ticketHolders).values({
                orderItemId: item.id,
                qrCode,
                attendeeName: userName,
                attendeeEmail: userEmail,
              })
            }
          }
        }
      })

      return NextResponse.json({
        message: 'Payment verified successfully',
        status: 'paid',
        orderId,
      })

    } else if (status === 'cancelled') {
      // User cancelled - restore ticket availability
      await db.transaction(async (tx) => {
        // Update order status to cancelled
        await tx
          .update(orders)
          .set({ status: 'cancelled' })
          .where(eq(orders.id, orderId))

        // Restore ticket availability
        for (const { ticketId, quantity } of ticketValidations) {
          const ticket = await tx.query.tickets.findFirst({
            where: eq(tickets.id, ticketId),
          })
          if (ticket) {
            await tx
              .update(tickets)
              .set({ sold: Math.max(0, ticket.sold - quantity) })
              .where(eq(tickets.id, ticketId))
          }
        }
      })

      return NextResponse.json({
        message: 'Order cancelled, tickets restored',
        status: 'cancelled',
        orderId,
      })

    } else if (status === 'failed' || status === 'error') {
      // Payment failed due to system error - keep tickets reserved, allow retry
      await db
        .update(orders)
        .set({ status: 'pending' })
        .where(eq(orders.id, orderId))

      return NextResponse.json({
        message: 'Payment failed, order kept for retry',
        status: 'pending',
        orderId,
      })
    }

    return NextResponse.json(
      { message: 'Invalid status' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { message: 'Failed to update order' },
      { status: 500 }
    )
  }
}