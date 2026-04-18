'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function ForgotPasswordPage() {
  const { isDark } = useTheme()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      setSuccess(true)
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-950 px-4 py-12">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
            <p className="text-gray-600 dark:text-text-secondary mb-6">
              We&apos;ve sent password reset instructions to <span className="font-medium text-gray-900 dark:text-white">{email}</span>
            </p>
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Back to sign in
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-950 px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">JM</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password?</h1>
          <p className="text-gray-600 dark:text-text-secondary mt-2">No worries, we&apos;ll send you reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
            Back to sign in
          </Link>
        </div>
      </Card>
    </div>
  )
}