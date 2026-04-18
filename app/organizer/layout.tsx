import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { OrganizerLayoutClient } from './OrganizerLayoutClient'

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'organizer') {
    redirect('/login')
  }

  return <OrganizerLayoutClient>{children}</OrganizerLayoutClient>
}