'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/components/providers/ThemeProvider'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isDark } = useTheme()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenError, setTokenError] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setTokenError('Invalid or missing reset token')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      router.push('/login?reset=success')
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-950 px-4 py-12">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Link</h1>
            <p className="text-gray-600 dark:text-text-secondary mb-6">{tokenError}</p>
            <Link href="/forgot-password" className="text-primary-400 hover:text-primary-300 font-medium">
              Request new reset link
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset password</h1>
          <p className="text-gray-600 dark:text-text-secondary mt-2">Create a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />

          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-950">
        <div className="text-gray-600 dark:text-text-secondary">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}