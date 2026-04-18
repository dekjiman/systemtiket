'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Plus, Search, Calendar, MapPin, Users, Ticket, MoreVertical, Edit, Trash2, Eye } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

interface Event {
  id: string
  title: string
  startDate: string
  venue: string
  city: string
  status: string
  ticketsSold: number
  revenue: number
  tickets?: { id: string; name: string; price: number; available: number }[]
}

export default function OrganizerEventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isDark } = useTheme()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session && session.user.role === 'organizer') {
      fetch('/api/events?organizer=true&status=all')
        .then(res => res.json())
        .then(data => {
          setEvents(data.events || [])
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

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Published</Badge>
      case 'draft':
        return <Badge variant="warning">Draft</Badge>
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Events</h1>
          <p className="text-gray-600 dark:text-text-secondary">Manage your events</p>
        </div>
        <Link href="/organizer/events/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-text-secondary" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-600 dark:text-text-secondary">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 dark:text-text-secondary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-text-secondary mb-4">No events found</p>
          <Link href="/organizer/events/create">
            <Button>Create Your First Event</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                    {getStatusBadge(event.status)}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-text-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.startDate).toLocaleDateString('id-ID')}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.venue}, {event.city}
                    </div>
                    <div className="flex items-center gap-1">
                      <Ticket className="w-4 h-4" />
                      {event.ticketsSold} sold
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/events/${event.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/organizer/events/${event.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-danger" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}