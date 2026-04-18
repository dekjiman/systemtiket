import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, passwordResetTokens } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      )
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    })

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`

    await transporter.sendMail({
      from: `"JustMine" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your password - JustMine',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Reset Password
          </a>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #666; font-size: 12px;">JustMine - Event Management</p>
        </div>
      `,
    })

    return NextResponse.json({ message: 'Reset link sent' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}