'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
} from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isDark } = useTheme()
  const user = session?.user
  const [collapsed, setCollapsed] = useState(false)

  const organizerLinks = [
    { name: 'Dashboard', href: '/organizer', icon: LayoutDashboard },
    { name: 'My Events', href: '/organizer/events', icon: Calendar },
    { name: 'Tickets', href: '/organizer/tickets', icon: Ticket },
    { name: 'Attendees', href: '/organizer/attendees', icon: Users },
    { name: 'Analytics', href: '/organizer/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/organizer/settings', icon: Settings },
  ]

  const userLinks = [
    { name: 'Dashboard', href: '/user', icon: LayoutDashboard },
    { name: 'My Tickets', href: '/user/tickets', icon: Ticket },
    { name: 'Following', href: '/user/following', icon: Users },
    { name: 'Settings', href: '/user/settings', icon: Settings },
  ]

  const links = user?.role === 'organizer' ? organizerLinks : userLinks

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-800 transition-all duration-300 z-50',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center border-b border-gray-200 dark:border-dark-800 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">JM</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-gray-900 dark:text-white text-lg">JustMine</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          const Icon = link.icon

          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-400/10 text-primary-400'
                  : 'text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
              )}
              title={collapsed ? link.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{link.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-dark-800 p-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center flex-shrink-0">
            {user?.role === 'organizer' ? (
              <Building2 className="w-4 h-4 text-primary-400" />
            ) : (
              <User className="w-4 h-4 text-accent" />
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-text-secondary truncate capitalize">
                {user?.role}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-full flex items-center justify-center text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </div>
    </aside>
  )
}
