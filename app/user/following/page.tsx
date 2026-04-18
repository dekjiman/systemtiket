import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export default async function UserFollowingPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'user') {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Following</h1>
      <p className="text-gray-600 dark:text-text-secondary">Artist and event following coming soon</p>
    </div>
  )
}