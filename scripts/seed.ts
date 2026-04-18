import { db } from '@/lib/db'
import { users, organizers, events, tickets } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { pgTable } from 'drizzle-orm/pg-core'
import bcrypt from 'bcryptjs'
import { createId } from '@paralleldrive/cuid2'

// Helper to delete all rows from a table
async function deleteAll(table: ReturnType<typeof pgTable>) {
  await db.delete(table).where(sql`true`)
}

async function seed() {
  console.log('🌱 Starting database seed...')

  // Check if users already exist
  const existingUsers = await db.query.users.findMany()
  
  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 12)

  let organizerUserId: string
  let organizerProfileId: string

  // Create or get organizer user
  let organizerUser = existingUsers.find(u => u.email === 'organizer@justmine.id')
  
  if (!organizerUser) {
    const [newOrganizer] = await db.insert(users).values({
      email: 'organizer@justmine.id',
      password: hashedPassword,
      name: 'Event Organizer',
      role: 'organizer',
      emailVerified: new Date(),
    }).returning()
    organizerUser = newOrganizer
  }
  organizerUserId = organizerUser.id

  // Create or get organizer profile
  const existingOrganizer = await db.query.organizers.findFirst({
    where: eq(organizers.userId, organizerUserId)
  })
  
  if (!existingOrganizer) {
    const [newOrg] = await db.insert(organizers).values({
      userId: organizerUserId,
      organizationName: 'JustMine Events',
      phone: '+628123456789',
      address: 'Jl. Sudirman No. 1, Jakarta',
      verified: true,
    }).returning()
    organizerProfileId = newOrg.id
  } else {
    organizerProfileId = existingOrganizer.id
  }

  // Delete existing events and tickets to avoid duplicates
  await deleteAll(tickets)
  await deleteAll(events)

  // Create sample events
  const [event1] = await db.insert(events).values({
    organizerId: organizerProfileId,
    title: 'Summer Sonic Festival 2024',
    description: 'The biggest music festival in Southeast Asia featuring international and local artists. Experience three days of non-stop music, food, and fun.',
    venue: 'Jakarta Convention Center',
    address: 'Jl. Jenderal Sudirman, Jakarta Selatan',
    city: 'Jakarta',
    startDate: new Date('2024-08-15T14:00:00'),
    endDate: new Date('2024-08-17T23:00:00'),
    status: 'published',
    slug: 'summer-sonic-festival-2024-' + createId().slice(0, 8),
  }).returning()

  const [event2] = await db.insert(events).values({
    organizerId: organizerProfileId,
    title: 'Jazz Night Jakarta',
    description: 'An intimate evening of smooth jazz featuring legendary artists from around the world.',
    venue: 'Hotel Indonesia Kempinski',
    address: 'Jl. MH Thamrin No. 1',
    city: 'Jakarta',
    startDate: new Date('2024-07-20T19:00:00'),
    endDate: new Date('2024-07-20T23:00:00'),
    status: 'published',
    slug: 'jazz-night-jakarta-' + createId().slice(0, 8),
  }).returning()

  // Create tickets for event 1
  await db.insert(tickets).values([
    {
      eventId: event1.id,
      name: 'VIP Access',
      description: 'Premium viewing area, exclusive merch, meet & greet',
      price: 2500000,
      quantity: 100,
      maxPerOrder: 2,
      isActive: true,
    },
    {
      eventId: event1.id,
      name: 'Regular 3-Day Pass',
      description: 'Full access to all stages for 3 days',
      price: 1500000,
      quantity: 2000,
      maxPerOrder: 4,
      isActive: true,
    },
    {
      eventId: event1.id,
      name: 'Single Day - Saturday',
      description: 'Access for Saturday only',
      price: 800000,
      quantity: 1000,
      maxPerOrder: 6,
      isActive: true,
    }
  ])

  // Create tickets for event 2
  await db.insert(tickets).values([
    {
      eventId: event2.id,
      name: 'VIP Table',
      description: 'Reserved table with bottle service',
      price: 3000000,
      quantity: 20,
      maxPerOrder: 1,
      isActive: true,
    },
    {
      eventId: event2.id,
      name: 'Regular',
      description: 'General admission',
      price: 850000,
      quantity: 300,
      maxPerOrder: 4,
      isActive: true,
    }
  ])

  console.log('✅ Database seeded successfully!')
  console.log('👤 Test accounts:')
  console.log('   Organizer: organizer@justmine.id / password123')
  console.log('   Fan: fan@justmine.id / password123')
  console.log('🎉 Events created:')
  console.log('   - Summer Sonic Festival 2024')
  console.log('   - Jazz Night Jakarta')
}

seed()
  .then(() => {
    console.log('Seed completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
