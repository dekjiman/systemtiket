'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TicketQR } from '@/components/event/TicketQR'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Loader2, Ticket, Calendar, MapPin, User, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function UserTicketsPage() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tickets/mine')
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch tickets')
        }
        return res.json()
      })
      .then(data => {
        setTickets(data.tickets || [])
      })
      .catch(err => {
        console.error('Error:', err)
        setError('Failed to load tickets')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tickets</h1>

      {error && (
        <Card className="p-4 bg-danger/20 border-danger">
          <p className="text-danger">{error}</p>
        </Card>
      )}

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800">
          <Ticket className="w-12 h-12 text-gray-400 dark:text-text-secondary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-text-secondary mb-4">No tickets purchased yet</p>
          <Link href="/events">
            <Button variant="primary">Browse Events</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.eventTitle}</h3>
                  <span className="inline-block px-2 py-1 text-xs bg-primary-400/20 text-primary-400 rounded mt-1">
                    {ticket.ticketType}
                  </span>
                </div>
                {ticket.checkedIn && (
                  <span className="px-2 py-1 text-xs bg-success/20 text-success rounded">
                    Checked In
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-text-secondary mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{ticket.eventDate ? format(new Date(ticket.eventDate), 'MMM dd, yyyy HH:mm') : 'TBA'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{ticket.eventVenue || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{ticket.attendeeName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{ticket.attendeeEmail}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mt-4">
                <img 
                  src={ticket.qrCode} 
                  alt="Ticket QR Code" 
                  className="w-full max-w-[200px] mx-auto"
                />
                <p className="text-xs text-center text-gray-900 dark:text-dark-900 font-mono mt-2">
                  {ticket.ticketCode}
                </p>
              </div>

              <p className="text-xs text-gray-500 dark:text-text-secondary mt-4">
                Purchased: {ticket.purchasedAt ? format(new Date(ticket.purchasedAt), 'MMM dd, yyyy') : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}