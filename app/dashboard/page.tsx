'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    const role = session.user?.role || 'user'
    if (role === 'organizer') {
      router.push('/organizer')
    } else {
      router.push('/user')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>
  )
}