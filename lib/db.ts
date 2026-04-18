import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { users, organizers, events, tickets, orders, orderItems, ticketHolders, payments, follows, notifications, carts, cartItems, passwordResetTokens } from './schema'

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

const pool = new Pool({
  connectionString,
})

export const db = drizzle(pool, {
  schema: {
    users,
    organizers,
    events,
    tickets,
    orders,
    orderItems,
    ticketHolders,
    payments,
    follows,
    notifications,
    carts,
    cartItems,
    passwordResetTokens,
  }
})

export type Database = typeof db
