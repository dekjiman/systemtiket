import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { UserLayoutClient } from './UserLayoutClient'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'user') {
    redirect('/login')
  }

  return <UserLayoutClient>{children}</UserLayoutClient>
}