export interface User {
  id: string
  email: string
  name?: string | null
  role: 'user' | 'organizer' | 'admin'
  createdAt: Date
  updatedAt: Date
}

export interface Organizer {
  id: string
  userId: string
  organizationName: string
  taxId?: string | null
  phone: string
  address?: string | null
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  organizerId: string
  title: string
  description?: string | null
  posterUrl?: string | null
  venue: string
  address: string
  city: string
  startDate: Date
  endDate?: Date | null
  status: 'draft' | 'published' | 'completed' | 'cancelled'
  totalCapacity?: number | null
  slug: string
  createdAt: Date
  updatedAt: Date
}

export interface Ticket {
  id: string
  eventId: string
  name: string
  description?: string | null
  price: number
  quantity: number
  sold: number
  maxPerOrder: number
  saleStart?: Date | null
  saleEnd?: Date | null
  isActive: boolean
  createdAt: Date
}

export interface Order {
  id: string
  userId: string
  eventId: string
  totalAmount: number
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  paymentMethod?: string | null
  paymentId?: string | null
  paidAt?: Date | null
  createdAt: Date
}

export interface OrderItem {
  id: string
  orderId: string
  ticketId: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface TicketHolder {
  id: string
  orderItemId: string
  qrCode: string
  attendeeName?: string | null
  attendeeEmail?: string | null
  checkedIn: boolean
  checkedInAt?: Date | null
  createdAt: Date
}

export interface Payment {
  id: string
  orderId: string
  provider: string
  providerTransactionId?: string | null
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  errorMessage?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Follow {
  id: string
  userId: string
  eventId: string
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message?: string | null
  data?: string | null
  read: boolean
  createdAt: Date
}
