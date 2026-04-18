'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Ticket, Calendar, MapPin, QrCode, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/components/providers/ThemeProvider'

type TicketData = {
  id: string
  orderId: string
  eventTitle: string
  eventDate: string
  eventVenue: string
  attendeeName: string
  attendeeEmail: string
  ticketType: string
  ticketCode: string
  qrCode: string
  checkedIn: boolean
  purchasedAt: string
}

type TicketModalProps = {
  ticket: TicketData
  onClose: () => void
}

function TicketModal({ ticket, onClose }: TicketModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-dark-900 rounded-xl p-6 max-w-sm w-full border border-gray-200 dark:border-dark-800" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ticket QR</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg mb-4">
          <img 
            src={ticket.qrCode}
            alt="QR Code"
            className="w-full h-auto"
          />
        </div>
        
        <div className="space-y-2 text-center">
          <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{ticket.ticketCode}</p>
          <p className="text-gray-900 dark:text-white font-medium">{ticket.eventTitle}</p>
          <p className="text-sm text-gray-600 dark:text-text-secondary">{ticket.ticketType}</p>
          <p className="text-sm text-gray-600 dark:text-text-secondary">{new Date(ticket.eventDate).toLocaleDateString()}</p>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-text-secondary text-center mt-4">
          Show this QR code at the venue entrance
        </p>
      </div>
    </div>
  )
}

export default function UserDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isDark } = useTheme()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && session?.user?.role === 'user') {
      fetch('/api/tickets/mine')
        .then(res => res.json())
        .then(data => {
          setTickets(data.tickets || [])
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [status, router, session])

  const upcomingEvents = tickets.filter(t => new Date(t.eventDate) > new Date()).length
  const scannedCount = tickets.filter(t => t.checkedIn).length

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  if (!session || session.user.role !== 'user') {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
        <p className="text-gray-600 dark:text-text-secondary">Manage your tickets and account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-400/10 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '-' : tickets.length}</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Active Tickets</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '-' : upcomingEvents}</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Upcoming Events</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '-' : scannedCount}</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Scanned In</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Tickets</h2>
          <Link href="/user/tickets">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="w-12 h-12 text-gray-400 dark:text-text-secondary mx-auto mb-3" />
            <p className="text-gray-600 dark:text-text-secondary mb-4">No tickets yet</p>
            <Link href="/events">
              <Button variant="primary">Browse Events</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800 gap-4"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{ticket.eventTitle}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 dark:text-text-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString() : 'TBA'}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {ticket.eventVenue || 'TBA'}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant={ticket.checkedIn ? 'success' : 'primary'}>{ticket.ticketType}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-text-secondary">Ticket Code</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">{ticket.ticketCode}</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Show QR
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Following</h2>
          <Link href="/user/following">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-text-secondary mb-4">Not following any artists yet</p>
          <Link href="/events">
            <Button variant="secondary">Explore Events</Button>
          </Link>
        </div>
      </Card>

      {selectedTicket && (
        <TicketModal 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  )
}