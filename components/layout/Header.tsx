'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Bell, LogOut, Menu, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/components/providers/ThemeProvider'

export function Header() {
  const { data: session } = useSession()
  const { theme, toggleTheme, isDark } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-40 h-16 bg-white dark:bg-dark-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-dark-800 flex items-center justify-between px-6">
      {/* Mobile menu button */}
      <button className="lg:hidden text-gray-600 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white">
        <Menu className="w-6 h-6" />
      </button>

      {/* Search */}
      <div className="hidden md:block flex-1 max-w-md mx-4">
        {/* SearchBar could be added here */}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        {mounted && (
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {session?.user?.name || session?.user?.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-text-secondary capitalize">
              {session?.user?.role}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
