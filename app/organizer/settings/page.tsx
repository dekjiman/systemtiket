'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function OrganizerSettingsPage() {
  const { data: session } = useSession()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-text-secondary">Manage your organizer account settings</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Organization Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Organization Name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Enter organization name"
          />

          <Input
            label="Contact Email"
            type="email"
            value={session?.user?.email || ''}
            disabled
          />

          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+62xxx"
          />

          <div className="space-y-2">
            <label className="text-sm text-gray-700 dark:text-text-secondary">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter organization address"
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-800 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-text-secondary focus:outline-none focus:border-primary-400"
            />
          </div>

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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Payment Settings</h2>
        
        <div className="space-y-4">
          <Input
            label="Bank Name"
            placeholder="Enter bank name"
          />

          <Input
            label="Account Number"
            placeholder="Enter account number"
          />

          <Input
            label="Account Holder Name"
            placeholder="Enter account holder name"
          />

          <Button type="button">
            Update Bank Details
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800">
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Sales Notifications</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Get notified when tickets are purchased</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary-400" />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800">
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Payout Alerts</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Get notified about payout status</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary-400" />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800">
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Weekly Reports</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Receive weekly sales reports</p>
            </div>
            <input type="checkbox" className="w-5 h-5 accent-primary-400" />
          </label>
        </div>
      </Card>

      <Card className="p-6 border-danger/20">
        <h2 className="text-xl font-semibold text-danger mb-6">Danger Zone</h2>
        
        <p className="text-gray-600 dark:text-text-secondary mb-4">
          Once you delete your organization, there is no going back. Please be certain.
        </p>
        
        <Button variant="danger" type="button">
          Delete Organization
        </Button>
      </Card>
    </div>
  )
}