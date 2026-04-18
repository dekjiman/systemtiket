'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { EventGrid } from '@/components/event/EventGrid'
import { SearchFilters } from '@/components/event/SearchFilters'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/components/providers/ThemeProvider'

function HeaderNav() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const { isDark } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center gap-3">
      {!mounted ? (
        <div className="w-16 h-8 bg-gray-200 dark:bg-dark-800 animate-pulse rounded" />
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
  )
}

function EventsContent() {
  const searchParams = useSearchParams()
  const city = searchParams.get('city') || undefined
  const genre = searchParams.get('genre') || undefined
  const date = searchParams.get('date') || undefined
  const { isDark } = useTheme()

  return (
    <>
      {/* Page Title */}
      <div className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upcoming Events</h1>
          <p className="text-gray-600 dark:text-text-secondary">
            Discover amazing concerts and live experiences
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-30 border-b border-gray-200 dark:border-dark-800 bg-white dark:bg-dark-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Suspense fallback={<div>Loading filters...</div>}>
            <SearchFilters />
          </Suspense>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading events...</div>}>
          <EventGrid filters={{ city, genre, date }} />
        </Suspense>
      </div>
    </>
  )
}

export default function EventsPage() {
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
            <HeaderNav />
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="text-gray-900 dark:text-white">Loading...</div>}>
        <EventsContent />
      </Suspense>
    </div>
  )
}