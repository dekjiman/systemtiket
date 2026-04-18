'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function UserSettingsPage() {
  const { data: session, update } = useSession()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // First try session data, then fallback to API
    if (session?.user) {
      setName(session.user.name || '')
      setPhone(session.user.phone || '')
    }

    // If phone is empty in session, fetch from API
    if (!session?.user?.phone) {
      fetch('/api/user/settings')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setName(data.user.name || '')
            setPhone(data.user.phone || '')
          }
        })
        .catch(console.error)
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })

      if (res.ok) {
        setSuccess(true)
        await update({ ...session, user: { ...session?.user, name, phone } })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-text-secondary">Manage your account settings and preferences</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />

          <Input
            label="Email"
            type="email"
            value={session?.user?.email || ''}
            disabled
          />

          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+62 812-3456-7890"
          />

          {success && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
              Settings saved successfully!
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800">
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Receive updates about your tickets and events</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary-400" />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800">
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Event Reminders</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Get reminded before events start</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary-400" />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800">
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Marketing Emails</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Receive news about new events</p>
            </div>
            <input type="checkbox" className="w-5 h-5 accent-primary-400" />
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Password</h2>
        
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
          />

          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm new password"
          />

          <Button type="button">
            Update Password
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-danger/20">
        <h2 className="text-xl font-semibold text-danger mb-6">Danger Zone</h2>
        
        <p className="text-gray-600 dark:text-text-secondary mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        
        <Button variant="danger" type="button">
          Delete Account
        </Button>
      </Card>
    </div>
  )
}