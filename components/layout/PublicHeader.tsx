'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

export function PublicHeader() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center gap-3">
      {!mounted ? (
        <div className="w-16 h-8 bg-dark-800 animate-pulse rounded" />
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