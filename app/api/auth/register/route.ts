import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users, organizers } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

// Use crypto.randomUUID() for ID generation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, role = 'user', organizationName, phone, taxId, address } = body

    // Validation
    if (!email || !password || !phone) {
      return NextResponse.json(
        { message: 'Email, password, and phone are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role,
      emailVerified: new Date(),
    }).returning()

    // If organizer, create organizer profile
    if (role === 'organizer' && organizationName) {
      await db.insert(organizers).values({
        userId: newUser.id,
        organizationName,
        phone,
        taxId,
        address,
      })
    }

    return NextResponse.json(
      { message: 'User created successfully', userId: newUser.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
