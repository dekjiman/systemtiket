import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, passwordResetTokens } from '@/lib/schema'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1)

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, resetToken.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))

    return NextResponse.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}