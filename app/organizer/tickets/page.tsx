'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Search, Ticket, QrCode, Download, Filter, Loader2 } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

interface TicketData {
  id: string
  name: string
  price: number
  quantity: number
  sold: number
  isActive: boolean
  eventId: string
  eventTitle: string
}

export default function OrganizerTicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isDark } = useTheme()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session && session.user.role === 'organizer') {
      fetchTickets()
    } else if (session && session.user.role !== 'organizer') {
      router.push('/')
    }
  }, [session, router])

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/organizer/tickets')
      const data = await res.json()
      
      if (res.ok) {
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !session || session.user.role !== 'organizer') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0)
  const totalSold = tickets.reduce((sum, t) => sum + t.sold, 0)
  const totalRevenue = tickets.reduce((sum, t) => sum + (t.price * t.sold), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tickets</h1>
        <p className="text-gray-600 dark:text-text-secondary">Manage ticket types and inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-400/10 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTickets}</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Total Tickets</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSold}</p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Tickets Sold</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalTickets > 0 ? ((totalSold / totalTickets) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-sm text-gray-600 dark:text-text-secondary">Sold Rate</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-text-secondary" />
            <Input placeholder="Search tickets..." className="pl-10" />
          </div>
          <Button variant="secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <Ticket className="w-16 h-16 text-gray-400 dark:text-text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Tickets Yet</h2>
          <p className="text-gray-600 dark:text-text-secondary mb-6">Create an event first to manage tickets</p>
          <Button variant="primary" onClick={() => router.push('/organizer/events/new')}>
            Create Event
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.name}</h3>
                    <Badge variant={!ticket.isActive ? 'default' : ticket.sold >= ticket.quantity ? 'danger' : 'success'}>
                      {!ticket.isActive ? 'Inactive' : ticket.sold >= ticket.quantity ? 'Sold Out' : 'Available'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-text-secondary">{ticket.eventTitle}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-text-secondary">
                    <span>Price: Rp {ticket.price.toLocaleString('id-ID')}</span>
                    <span>Sold: {ticket.sold} / {ticket.quantity}</span>
                  </div>
                </div>
                <div className="w-32 h-2 bg-gray-200 dark:bg-dark-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-400 rounded-full"
                    style={{ width: `${(ticket.sold / ticket.quantity) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}