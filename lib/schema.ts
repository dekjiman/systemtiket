import { pgTable, text, timestamp, integer, boolean, real, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password').notNull(),
  role: text('role', { enum: ['user', 'organizer', 'admin'] }).notNull().default('user'),
  phone: text('phone'),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const organizers = pgTable('organizers', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationName: text('organization_name').notNull(),
  taxId: text('tax_id'),
  phone: text('phone').notNull(),
  address: text('address'),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const events = pgTable('events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizerId: uuid('organizer_id').notNull().references(() => organizers.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  posterUrl: text('poster_url'),
  venue: text('venue').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: text('status', { enum: ['draft', 'published', 'completed', 'cancelled'] }).notNull().default('draft'),
  totalCapacity: integer('total_capacity'),
  slug: text('slug').notNull().unique(),
  lineup: text('lineup'),
  rundown: text('rundown'),
  venueMapUrl: text('venue_map_url'),
  venueLatitude: text('venue_latitude'),
  venueLongitude: text('venue_longitude'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  quantity: integer('quantity').notNull(),
  sold: integer('sold').notNull().default(0),
  maxPerOrder: integer('max_per_order').notNull().default(4),
  saleStart: timestamp('sale_start'),
  saleEnd: timestamp('sale_end'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id),
  totalAmount: real('total_amount').notNull(),
  status: text('status', { enum: ['pending', 'paid', 'cancelled', 'refunded'] }).notNull().default('pending'),
  paymentMethod: text('payment_method'),
  paymentId: text('payment_id'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  subtotal: real('subtotal').notNull(),
})

export const ticketHolders = pgTable('ticket_holders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'cascade' }),
  qrCode: text('qr_code').notNull().unique(),
  attendeeName: text('attendee_name'),
  attendeeEmail: text('attendee_email'),
  checkedIn: boolean('checked_in').notNull().default(false),
  checkedInAt: timestamp('checked_in_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  provider: text('provider').notNull(),
  providerTransactionId: text('provider_transaction_id'),
  amount: real('amount').notNull(),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] }).notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const follows = pgTable('follows', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueConstraint: {
    name: 'follows_user_event_unique',
    columns: [table.userId, table.eventId],
  },
}))

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  data: text('data'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['active', 'checkout', 'expired'] }).notNull().default('active'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
