import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import { Calendar, DollarSign, Ticket, TrendingUp, Plus, Eye } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Organizer Dashboard - JustMine',
}

export default async function OrganizerDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'organizer') {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizer Dashboard</h1>
          <p className="text-gray-600 dark:text-text-secondary">Manage your events and track performance</p>
        </div>
        <Link href="/organizer/events/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-400/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Total Events</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Tickets Sold</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">Rp 0</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Total Revenue</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Check-ins</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Events</h2>
          <Link href="/organizer/events">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 dark:text-text-secondary mx-auto mb-3" />
          <p className="text-gray-600 dark:text-text-secondary mb-4">No events yet</p>
          <Link href="/organizer/events/create">
            <Button>Create Your First Event</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}