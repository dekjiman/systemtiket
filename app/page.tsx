'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { EventCard, type EventCardProps } from '@/components/event/EventCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Sun, Moon } from 'lucide-react'

interface ApiEvent {
  id: string
  title: string
  description?: string
  poster?: string
  venue: string
  city: string
  startDate: string
  endDate?: string
  status: string
  slug: string
  price: number
  tickets: { id: string; name: string; price: number; available: number }[]
  organizer: { id: string; organizationName: string } | null
}

function FeaturedEvents() {
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-dark-900 rounded-lg h-80" />
        ))}
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-full text-center py-8 text-gray-600 dark:text-text-secondary">
          No events available at the moment
        </div>
      </div>
    )
  }

  const eventCards: EventCardProps['event'][] = events.slice(0, 4).map(event => {
    const startDate = new Date(event.startDate)
    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      artist: event.organizer?.organizationName || 'JustMine',
      date: event.startDate,
      time: startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      venue: event.venue,
      city: event.city,
      price: event.price,
      poster: event.poster || undefined,
      soldOut: event.tickets?.every(t => t.available === 0) || false,
      tags: event.tickets?.map(t => t.name) || [],
    }
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {eventCards.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-dark-800 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">JM</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">JustMine</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <SearchBar placeholder="Search events, artists, venues..." />
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {!mounted ? (
                <>
                  <div className="w-16 h-8 bg-gray-200 dark:bg-dark-800 animate-pulse rounded" />
                </>
              ) : session ? (
                <>
                  <Link href={session.user.role === 'organizer' ? '/organizer' : '/user'}>
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                  <Link href="/events">
                    <Button variant="primary" size="sm">Browse Events</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Log In</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 via-transparent to-accent/10" />
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 animate-fade-in">
            Discover Live Music
            <br />
            <span className="text-gradient">Near You</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-text-secondary mb-8 max-w-2xl mx-auto">
            Find the best concerts and events in your city. Buy tickets securely and get instant access to your e-tickets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events">
              <Button size="lg">Explore Events</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" size="lg">Become an Organizer</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 bg-gray-50 dark:bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
            <Link href="/events" className="text-primary-400 hover:text-primary-300">
              View All →
            </Link>
          </div>
          <Suspense fallback={<div className="text-gray-900 dark:text-white">Loading...</div>}>
            <FeaturedEvents />
          </Suspense>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🎟️', title: 'Secure Ticketing', desc: 'QR-based e-tickets with anti-scalping protection and instant delivery.' },
              { icon: '📊', title: 'Real-time Analytics', desc: 'Track sales, monitor attendance, and understand your audience better.' },
              { icon: '💳', title: 'Easy Payment', desc: 'Multiple payment options including cards, e-wallets, and bank transfers.' },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-text-secondary">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-gradient-to-br from-primary-400 to-accent p-8 md:p-16 text-center overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Host Your Next Concert?
              </h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                Join hundreds of organizers who trust JustMine to sell out their events.
                Create your event in minutes, not hours.
              </p>
              <Link href="/register">
                <Button variant="secondary" size="lg" className="bg-white text-primary-400 hover:bg-white/90">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-dark-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { title: 'Product', links: ['Events', 'Organizers', 'Pricing', 'API'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Support', links: ['Help Center', 'Terms', 'Privacy', 'FAQ'] },
              { title: 'Social', links: ['Twitter', 'Instagram', 'Facebook', 'LinkedIn'] },
            ].map((column) => (
              <div key={column.title}>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{column.title}</h4>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-gray-600 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white text-sm">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-800 text-center text-gray-600 dark:text-text-secondary text-sm">
            © 2024 JustMine. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}