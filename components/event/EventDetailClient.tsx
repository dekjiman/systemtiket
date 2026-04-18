'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, MapPin, Clock, Tag, Heart, Share2, BadgeCheck, Star, Users, Car, Accessibility, ShoppingCart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TicketSelector } from '@/components/event/TicketSelector'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { useTheme } from '@/components/providers/ThemeProvider'

interface LineupArtist {
  name: string
  role: string
  imageUrl: string
}

interface RundownItem {
  date: string
  time: string
  activity: string
  description: string
}

interface Event {
  id: string
  title: string
  description?: string
  posterUrl?: string
  venue: string
  address: string
  city: string
  startDate: string
  endDate?: string
  status: string
  organizer: {
    id: string
    organizationName: string
  }
  tickets: {
    id: string
    name: string
    description?: string
    price: number
    quantity: number
    sold: number
    maxPerOrder: number
    isActive: boolean
  }[]
  lineup?: LineupArtist[] | null
  rundown?: RundownItem[] | null
  venueMapUrl?: string
  venueLatitude?: string
  venueLongitude?: string
}

type TabType = 'overview' | 'lineup' | 'rundown' | 'venue' | 'tickets'

export function EventDetailClient({ event }: { event: Event }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { isDark } = useTheme()
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const [imageError, setImageError] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedMessage, setAddedMessage] = useState('')

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'EEEE, MMMM dd, yyyy')
  }

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)
  const totalPrice = Object.entries(selectedTickets).reduce((sum, [ticketId, qty]) => {
    const ticket = event.tickets.find(t => t.id === ticketId)
    return sum + (ticket?.price || 0) * qty
  }, 0)

  const handleAddToCart = async () => {
    if (totalTickets === 0) return
    
    // Check if logged in
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setAddingToCart(true)
    setAddedMessage('')

    try {
      // Add each ticket type to cart
      for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
        if (quantity > 0) {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: event.id,
              ticketId,
              quantity,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || 'Failed to add to cart')
          }
        }
      }

      setAddedMessage(`Added ${totalTickets} ticket(s) to cart!`)
      setSelectedTickets({})
      
      // Redirect to cart after short delay
      setTimeout(() => {
        router.push('/cart')
      }, 1500)
    } catch (error: any) {
      alert(error.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleViewCart = () => {
    router.push('/cart')
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: event.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JM</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">JustMine</span>
          </Link>
          <div className="flex items-center gap-3">
            <PublicHeader />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 70% */}
          <div className="lg:col-span-2 space-y-6">
            {/* Poster */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-900">
              {event.posterUrl && event.posterUrl.trim() !== '' && !imageError ? (
                <img
                  src={!event.posterUrl.startsWith('/') && !event.posterUrl.startsWith('http') ? '/' + event.posterUrl : event.posterUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-400/20 to-accent/20 flex items-center justify-center">
                  <span className="text-6xl">🎵</span>
                </div>
              )}
            </div>

            {/* Event Info */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <Link
                    href={`/organizer/${event.organizer.id}`}
                    className="text-sm text-primary-400 hover:text-primary-300"
                  >
                    {event.organizer.organizationName}
                  </Link>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-1">
                    {event.title}
                  </h1>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-gray-600 dark:text-text-secondary">
                  <Calendar className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDate(event.startDate)}</p>
                    {event.endDate && (
                      <p className="text-sm">until {formatDate(event.endDate)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-text-secondary">
                  <Clock className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{formatTime(event.startDate)}</p>
                    {event.endDate && (
                      <p className="text-sm">until {formatTime(event.endDate)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-text-secondary">
                  <MapPin className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{event.venue}</p>
                    <p className="text-sm">{event.address}, {event.city}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                <Badge variant="primary">Concert</Badge>
                <Badge variant="success">Tickets Available</Badge>
                {event.tickets.some(t => t.sold / t.quantity > 0.8) && (
                  <Badge variant="warning">Almost Sold Out</Badge>
                )}
              </div>

              {/* Tabs Navigation */}
              <div className="mt-8">
                <div className="border-b border-gray-200 dark:border-dark-800">
                  <nav className="flex space-x-8">
                    {(['overview', 'lineup', 'rundown', 'venue', 'tickets'] as TabType[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-4 px-1 border-b-2 font-medium capitalize transition-colors ${
                          activeTab === tab
                            ? 'border-primary-400 text-primary-400'
                            : 'border-transparent text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="py-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="prose prose-invert max-w-none">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About this event</h2>
                      {event.description ? (
                        <p className="text-gray-600 dark:text-text-secondary leading-relaxed whitespace-pre-wrap">
                          {event.description}
                        </p>
                      ) : (
                        <p className="text-gray-600 dark:text-text-secondary">No description available</p>
                      )}
                    </div>
                  )}

                  {/* Lineup Tab */}
                  {activeTab === 'lineup' && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Lineup</h2>
                      {event.lineup && event.lineup.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {event.lineup.map((artist, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-dark-900 rounded-lg p-4 flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-800 flex-shrink-0">
                                {artist.imageUrl ? (
                                  <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Users className="w-6 h-6 text-gray-400 dark:text-text-secondary" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-gray-900 dark:text-white font-medium">{artist.name}</p>
                                <Badge 
                                  variant={artist.role === 'headliner' ? 'warning' : artist.role === 'supporting' ? 'primary' : 'default'}
                                  className="mt-1"
                                >
                                  {artist.role === 'headliner' ? 'Headliner' : artist.role === 'supporting' ? 'Supporting' : 'Opening Act'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-text-secondary">No lineup information available</p>
                      )}
                    </div>
                  )}

                  {/* Rundown Tab */}
                  {activeTab === 'rundown' && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Schedule</h2>
                      {event.rundown && event.rundown.length > 0 ? (
                        <div className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-dark-800" />
                          <div className="space-y-6">
                            {event.rundown.map((item, index) => (
                              <div key={index} className="relative flex items-start gap-4 pl-8">
                                <div className="absolute left-2 w-4 h-4 rounded-full bg-primary-400 border-2 border-white dark:border-dark-950" />
                                <div className="bg-gray-50 dark:bg-dark-900 rounded-lg p-4 flex-1">
                                  <div className="flex items-center gap-4 mb-2">
                                    {item.date && (
                                      <span className="text-sm text-gray-600 dark:text-text-secondary">
                                        {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                    )}
                                    {item.time && (
                                      <>
                                        <Clock className="w-4 h-4 text-primary-400" />
                                        <span className="text-primary-400 font-medium">{item.time}</span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-gray-900 dark:text-white font-medium">{item.activity}</p>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 dark:text-text-secondary mt-1">{item.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-text-secondary">No schedule information available</p>
                      )}
                    </div>
                  )}

                  {/* Venue Tab */}
                  {activeTab === 'venue' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Venue Information</h2>
                      
                      <div className="flex items-start gap-4">
                        <MapPin className="w-6 h-6 text-primary-400 mt-1" />
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{event.venue}</p>
                          <p className="text-gray-600 dark:text-text-secondary">{event.address}, {event.city}</p>
                        </div>
                      </div>

                      {event.venueMapUrl && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-800">
                          <iframe
                            src={event.venueMapUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      )}

                      {(event.venueLatitude && event.venueLongitude) && !event.venueMapUrl && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-800">
                          <iframe
                            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1m3!2d${event.venueLongitude}!3d${event.venueLatitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDQ0JzAwLjAiTiAxMDbCsDUwJzAwLjAiRQfMDAwMDAwMDAw!5e0!3m2!1sen!2sid!4v1600000000000`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tickets Tab */}
                  {activeTab === 'tickets' && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ticket Types</h2>
                      {event.tickets.length > 0 ? (
                        <div className="space-y-4">
                          {event.tickets.map((ticket) => (
                            <div key={ticket.id} className="bg-gray-50 dark:bg-dark-900 rounded-lg p-4 flex items-center justify-between">
                              <div>
                                <p className="text-gray-900 dark:text-white font-medium">{ticket.name}</p>
                                {ticket.description && (
                                  <p className="text-sm text-gray-600 dark:text-text-secondary mt-1">{ticket.description}</p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-text-secondary mt-2">
                                  {ticket.quantity - ticket.sold} available of {ticket.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatPrice(ticket.price)}</p>
                                {ticket.sold >= ticket.quantity && (
                                  <Badge variant="danger" className="mt-1">Sold Out</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-text-secondary">No tickets available</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Ticket Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select Tickets</h3>
                  <p className="text-sm text-gray-600 dark:text-text-secondary">
                    {event.tickets.length} ticket types available
                  </p>
                </div>

                <TicketSelector
                  tickets={event.tickets}
                  selectedTickets={selectedTickets}
                  onSelectionChange={setSelectedTickets}
                />

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 dark:text-text-secondary">Total</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  
                  {addedMessage && (
                    <div className="mb-4 p-3 bg-success/20 border border-success/30 rounded-lg">
                      <p className="text-success text-sm">{addedMessage}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1"
                      onClick={handleAddToCart}
                      disabled={totalTickets === 0 || addingToCart}
                    >
                      {addingToCart ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart ({totalTickets > 0 ? totalTickets : ''})
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleViewCart}
                    >
                      View Cart
                    </Button>
                  </div>
                  {totalTickets === 0 && (
                    <p className="text-xs text-gray-500 dark:text-text-secondary text-center mt-2">
                      Please select at least one ticket
                    </p>
                  )}
                </div>

                {/* Urgency Bar if almost sold out */}
                {event.tickets.some(t => t.sold / t.quantity > 0.8) && (
                  <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-xs text-warning font-medium">
                      ⚠️ Limited tickets remaining – sell-out risk high
                    </p>
                    <div className="mt-2 h-1.5 bg-gray-200 dark:bg-dark-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full transition-all"
                        style={{
                          width: `${(event.tickets.reduce((sum, t) => sum + t.sold, 0) /
                            event.tickets.reduce((sum, t) => sum + t.quantity, 0)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
