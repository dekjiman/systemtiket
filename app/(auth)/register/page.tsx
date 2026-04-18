'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { User, Building2 } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function RegisterPage() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<'user' | 'organizer'>('user')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    phone: '',
    taxId: '',
    address: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Basic validation
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters')
        setLoading(false)
        return
      }

      // Register API call would go here
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Registration failed')
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Registration successful but sign in failed. Please try logging in.')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-950 px-4 py-12">
      <Card className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">JM</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-gray-600 dark:text-text-secondary mt-2">Join JustMine today</p>
        </div>

        {/* Role Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-text-secondary text-center mb-6">
              Choose how you want to use JustMine
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setRole('user')
                  setStep(2)
                }}
                className={`p-6 rounded-lg border-2 transition-all ${
                  role === 'user'
                    ? 'border-primary-400 bg-primary-400/10'
                    : 'border-gray-200 dark:border-dark-800 hover:border-gray-300 dark:hover:border-dark-700'
                }`}
              >
                <User className="w-8 h-8 mx-auto mb-3 text-primary-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Fan</h3>
                <p className="text-xs text-gray-600 dark:text-text-secondary mt-1">
                  Buy tickets, follow artists
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('organizer')
                  setStep(2)
                }}
                className={`p-6 rounded-lg border-2 transition-all ${
                  role === 'organizer'
                    ? 'border-primary-400 bg-primary-400/10'
                    : 'border-gray-200 dark:border-dark-800 hover:border-gray-300 dark:hover:border-dark-700'
                }`}
              >
                <Building2 className="w-8 h-8 mx-auto mb-3 text-accent" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Organizer</h3>
                <p className="text-xs text-gray-600 dark:text-text-secondary mt-1">
                  Create & manage events
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Registration Form */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center mb-4"
            >
              ← Back to role selection
            </button>

            {role === 'organizer' && (
              <Input
                label="Organization Name"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Your Company / Organization"
                required
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                required
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
              />
            </div>

            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+62 812-3456-7890"
              required
            />

            {role === 'organizer' && (
              <>
                <Input
                  label="Tax ID (NPWP) - Optional"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  placeholder="00.000.000.0-000.000"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                    Business Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-800 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-text-secondary focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all resize-none"
                    placeholder="Full business address"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-text-secondary">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-primary-400 hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary-400 hover:underline">
            Privacy Policy
          </Link>
        </div>
      </Card>
    </div>
  )
}
