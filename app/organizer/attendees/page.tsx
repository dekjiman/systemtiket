'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Search, Users, Mail, Phone, CheckCircle, XCircle, Download, QrCode, Loader2 } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

interface Attendee {
  id: string
  attendeeName: string
  attendeeEmail: string
  ticketType: string
  eventTitle: string
  eventId: string
  checkedIn: boolean
  checkedInAt: string | null
  qrCode: string
  purchaseDate: string
}

export default function OrganizerAttendeesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isDark } = useTheme()
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session && session.user.role === 'organizer') {
      fetchAttendees()
    } else if (session && session.user.role !== 'organizer') {
      router.push('/')
    }
  }, [session, router])

  const fetchAttendees = async () => {
    try {
      const res = await fetch('/api/organizer/attendees')
      const data = await res.json()
      
      if (res.ok) {
        setAttendees(data.attendees || [])
      }
    } catch (error) {
      console.error('Error fetching attendees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAttendees = attendees.filter(a => 
    a.attendeeName?.toLowerCase().includes(search.toLowerCase()) ||
    a.attendeeEmail?.toLowerCase().includes(search.toLowerCase())
  ).filter(a => !selectedEvent || a.eventId === selectedEvent)

  const checkedInCount = attendees.filter(a => a.checkedIn).length
  const uniqueEvents = Array.from(new Set(attendees.map(a => a.eventId))).map(id => ({
    id,
    title: attendees.find(a => a.eventId === id)?.eventTitle
  }))

  if (status === 'loading' || !session || session.user.role !== 'organizer') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendees</h1>
          <p className="text-gray-600 dark:text-text-secondary">View and manage event attendees</p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-400/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendees.length}</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Total Attendees</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{checkedInCount}</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Checked In</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendees.length - checkedInCount}</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Not Checked In</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-text-secondary" />
            <Input
              placeholder="Search attendees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-800 text-gray-900 dark:text-white rounded-lg px-4 py-2"
          >
            <option value="">All Events</option>
            {uniqueEvents.map(event => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" />
        </div>
      ) : filteredAttendees.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 dark:text-text-secondary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-text-secondary">No attendees found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAttendees.map((attendee) => (
            <Card key={attendee.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-400/10 rounded-full flex items-center justify-center">
                    <span className="text-primary-400 font-medium">
                      {attendee.attendeeName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{attendee.attendeeName || 'Unknown'}</h3>
                      {attendee.checkedIn ? (
                        <Badge variant="success">Checked In</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-text-secondary">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {attendee.attendeeEmail || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-900 dark:text-white">{attendee.ticketType}</p>
                    <p className="text-xs text-gray-500 dark:text-text-secondary">{attendee.eventTitle}</p>
                  </div>
                  <Button variant="ghost" size="sm" title="View QR Code">
                    <QrCode className="w-4 h-4" />
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