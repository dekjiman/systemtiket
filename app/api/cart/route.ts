import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { db } from '@/lib/db'
import { carts, cartItems, tickets, events, notifications } from '@/lib/schema'
import { eq, and, lte } from 'drizzle-orm'
import redis, { 
  lockTicket, 
  unlockTicket, 
  checkTicketLock,
  checkRateLimit,
} from '@/lib/redis'

const CART_EXPIRY_MINUTES = 10

async function createNotification(userId: string, type: string, title: string, message: string) {
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
  })
}

async function processExpiredCarts(userId: string) {
  const now = new Date()
  
  const expiredCarts = await db.query.carts.findMany({
    where: and(
      eq(carts.userId, userId),
      eq(carts.status, 'active'),
      lte(carts.expiresAt, now)
    ),
  })

  for (const cart of expiredCarts) {
    await db.update(carts)
      .set({ status: 'expired' })
      .where(eq(carts.id, cart.id))

    const cartItemsList = await db.query.cartItems.findMany({
      where: eq(cartItems.cartId, cart.id),
    })

    for (const item of cartItemsList) {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, item.ticketId),
      })
      if (ticket) {
        await db.update(tickets)
          .set({ sold: Math.max(0, ticket.sold - item.quantity) })
          .where(eq(tickets.id, ticket.id))
      }
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, cartItemsList[0]?.eventId || ''),
    })

    await createNotification(
      userId,
      'cart_expired',
      'Cart Expired',
      `Your cart for "${event?.title || 'event'}" has expired. Please book again.`
    )
  }
}

// GET - Get user's cart
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Process any expired carts for this user
    await processExpiredCarts(userId)

    // Get active cart
    const cart = await db.query.carts.findFirst({
      where: and(
        eq(carts.userId, userId),
        eq(carts.status, 'active')
      ),
    })

    if (!cart) {
      return NextResponse.json({ cart: null, items: [] })
    }

    // Check if cart expired
    if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
      // Mark as expired
      await db.update(carts)
        .set({ status: 'expired' })
        .where(eq(carts.id, cart.id))
      
      return NextResponse.json({ cart: null, items: [] })
    }

    // Get cart items with event and ticket info
    const items = await db.query.cartItems.findMany({
      where: eq(cartItems.cartId, cart.id),
    })

    // Enrich items with event and ticket data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const ticket = await db.query.tickets.findFirst({
          where: eq(tickets.id, item.ticketId),
        })
        
        const event = await db.query.events.findFirst({
          where: eq(events.id, item.eventId),
        })

        return {
          ...item,
          ticketName: ticket?.name || 'Ticket',
          eventTitle: event?.title || 'Event',
          eventDate: event?.startDate?.toISOString() || '',
          eventVenue: event?.venue || '',
          price: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        }
      })
    )

    // Calculate totals
    const subtotal = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const serviceFee = Math.round(subtotal * 0.03)
    const total = subtotal + serviceFee

    return NextResponse.json({
      cart,
      items: enrichedItems,
      summary: {
        itemCount: enrichedItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        serviceFee,
        total,
        expiresAt: cart.expiresAt?.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { message: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// POST - Add item to cart
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Please login to add tickets to cart' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await req.json()
    const { eventId, ticketId, quantity } = body

    if (!eventId || !ticketId || !quantity || quantity < 1) {
      return NextResponse.json(
        { message: 'Invalid data' },
        { status: 400 }
      )
    }

    // Rate limiting - max 10 add to cart requests per minute
    const canProceed = await checkRateLimit(userId, 'add_to_cart', 10, 60)
    if (!canProceed) {
      return NextResponse.json(
        { message: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    // Check if ticket is locked by another user
    const existingLock = await checkTicketLock(ticketId)
    if (existingLock && !existingLock.startsWith(userId)) {
      return NextResponse.json(
        { message: 'This ticket is being reserved by another user. Please try again.' },
        { status: 409 }
      )
    }

    // Verify ticket exists and has availability
    const ticket = await db.query.tickets.findFirst({
      where: and(
        eq(tickets.id, ticketId),
        eq(tickets.eventId, eventId),
        eq(tickets.isActive, true)
      ),
    })

    if (!ticket) {
      return NextResponse.json(
        { message: 'Ticket not found' },
        { status: 404 }
      )
    }

    const available = ticket.quantity - ticket.sold
    if (available < quantity) {
      return NextResponse.json(
        { message: `Only ${available} tickets available` },
        { status: 400 }
      )
    }

    // Try to lock the ticket for this user
    const locked = await lockTicket(ticketId, userId)
    if (!locked) {
      return NextResponse.json(
        { message: 'Ticket is being processed. Please try again.' },
        { status: 409 }
      )
    }

    // Get or create active cart
    let cart = await db.query.carts.findFirst({
      where: and(
        eq(carts.userId, userId),
        eq(carts.status, 'active')
      ),
    })

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + CART_EXPIRY_MINUTES)

    if (!cart) {
      // Create new cart
      const [newCart] = await db.insert(carts).values({
        userId,
        status: 'active',
        expiresAt,
      }).returning()
      cart = newCart
    } else if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
      // Cart expired, reset it
      await db.update(carts)
        .set({ expiresAt, status: 'active' })
        .where(eq(carts.id, cart.id))
      
      // Clear old items
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))
    }

    // Check if item already in cart
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.ticketId, ticketId)
      ),
    })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity
      
      // Check total availability
      const totalAvailable = ticket.quantity - ticket.sold
      if (newQuantity > totalAvailable) {
        return NextResponse.json(
          { message: `Only ${totalAvailable} tickets available in total` },
          { status: 400 }
        )
      }

      // Check max per order
      if (newQuantity > ticket.maxPerOrder) {
        return NextResponse.json(
          { message: `Maximum ${ticket.maxPerOrder} tickets per order` },
          { status: 400 }
        )
      }

      await db.update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existingItem.id))
    } else {
      // Add new item
      await db.insert(cartItems).values({
        cartId: cart.id,
        eventId,
        ticketId,
        quantity,
        unitPrice: Number(ticket.price),
      })
    }

    // Update cart expiry
    const newExpiry = new Date()
    newExpiry.setMinutes(newExpiry.getMinutes() + CART_EXPIRY_MINUTES)
    
    await db.update(carts)
      .set({ expiresAt: newExpiry, updatedAt: new Date() })
      .where(eq(carts.id, cart.id))

    // Release lock - ticket is now reserved in database
    await unlockTicket(ticketId, userId).catch(() => {})

    return NextResponse.json({
      message: 'Added to cart',
      cartId: cart.id,
    })
  } catch (error: any) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to add to cart' },
      { status: 500 }
    )
  }
}

// PUT - Update cart item quantity
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await req.json()
    const { itemId, quantity } = body

    if (!itemId || quantity < 1) {
      return NextResponse.json(
        { message: 'Invalid data' },
        { status: 400 }
      )
    }

    // Get user's cart
    const cart = await db.query.carts.findFirst({
      where: and(
        eq(carts.userId, userId),
        eq(carts.status, 'active')
      ),
    })

    if (!cart) {
      return NextResponse.json(
        { message: 'Cart not found' },
        { status: 404 }
      )
    }

    // Get cart item
    const item = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.id, itemId),
        eq(cartItems.cartId, cart.id)
      ),
    })

    if (!item) {
      return NextResponse.json(
        { message: 'Item not found' },
        { status: 404 }
      )
    }

    // Verify availability
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, item.ticketId),
    })

    if (!ticket) {
      return NextResponse.json(
        { message: 'Ticket not found' },
        { status: 404 }
      )
    }

    const available = ticket.quantity - ticket.sold
    if (quantity > available) {
      return NextResponse.json(
        { message: `Only ${available} tickets available` },
        { status: 400 }
      )
    }

    if (quantity > ticket.maxPerOrder) {
      return NextResponse.json(
        { message: `Maximum ${ticket.maxPerOrder} tickets per order` },
        { status: 400 }
      )
    }

    if (quantity === 0) {
      // Remove item
      await db.delete(cartItems).where(eq(cartItems.id, itemId))
    } else {
      // Update quantity
      await db.update(cartItems)
        .set({ quantity })
        .where(eq(cartItems.id, itemId))
    }

    return NextResponse.json({ message: 'Cart updated' })
  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { message: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from cart or clear cart
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    const clearAll = searchParams.get('clear') === 'true'

    // Get user's cart
    const cart = await db.query.carts.findFirst({
      where: and(
        eq(carts.userId, userId),
        eq(carts.status, 'active')
      ),
    })

    if (!cart) {
      return NextResponse.json(
        { message: 'Cart not found' },
        { status: 404 }
      )
    }

    if (clearAll) {
      // Clear all items
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))
    } else if (itemId) {
      // Remove specific item
      await db.delete(cartItems).where(eq(cartItems.id, itemId))
    } else {
      return NextResponse.json(
        { message: 'Specify itemId or clear=true' },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Item removed' })
  } catch (error) {
    console.error('Error removing from cart:', error)
    return NextResponse.json(
      { message: 'Failed to remove item' },
      { status: 500 }
    )
  }
}