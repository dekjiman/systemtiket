'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Calendar, DollarSign, Ticket, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

interface EventStats {
  id: string
  title: string
  startDate: string
  status: string
  ticketsSold: number
  revenue: number
  capacity: number | null
}

interface AnalyticsData {
  totalEvents: number
  totalTicketsSold: number
  totalRevenue: number
  totalAttendees: number
  events: EventStats[]
}

export default function OrganizerAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isDark } = useTheme()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session && session.user.role === 'organizer') {
      fetch('/api/organizer/analytics')
        .then(res => res.json())
        .then(data => {
          setData(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  if (status === 'loading' || !session || session.user.role !== 'organizer') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    )
  }

  const stats = data ? [
    {
      title: 'Total Events',
      value: data.totalEvents,
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      title: 'Tickets Sold',
      value: data.totalTicketsSold,
      icon: Ticket,
      color: 'text-green-500',
    },
    {
      title: 'Total Revenue',
      value: `$${data.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-yellow-500',
    },
    {
      title: 'Total Attendees',
      value: data.totalAttendees,
      icon: Users,
      color: 'text-purple-500',
    },
  ] : []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Published</Badge>
      case 'draft':
        return <Badge variant="warning">Draft</Badge>
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>
      case 'completed':
        return <Badge>Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-text-secondary">Track your event performance</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600 dark:text-text-secondary">Loading analytics...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-text-secondary">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gray-100 dark:bg-dark-900 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Performance</h2>
            {data.events.length === 0 ? (
              <p className="text-gray-600 dark:text-text-secondary text-center py-8">No events yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-800">
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-text-secondary font-medium">Event</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-text-secondary font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-text-secondary font-medium">Status</th>
                      <th className="text-right py-3 px-4 text-gray-600 dark:text-text-secondary font-medium">Sold</th>
                      <th className="text-right py-3 px-4 text-gray-600 dark:text-text-secondary font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.map((event) => (
                      <tr key={event.id} className="border-b border-gray-200 dark:border-dark-800">
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-white font-medium">{event.title}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-text-secondary">
                          {new Date(event.startDate).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(event.status)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                          {event.ticketsSold}
                          {event.capacity && (
                            <span className="text-gray-500 dark:text-text-secondary text-sm ml-1">
                              / {event.capacity}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-green-500 font-medium">
                          ${event.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 dark:text-text-secondary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-text-secondary">No analytics data available</p>
        </Card>
      )}
    </div>
  )
}