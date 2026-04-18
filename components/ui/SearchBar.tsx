'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from './Input'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
  defaultValue?: string
}

export function SearchBar({ placeholder = 'Search...', onSearch, className, defaultValue }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue || '')

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch?.(value)
  }

  const clearSearch = () => {
    setQuery('')
    onSearch?.('')
  }

  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-dark-900 border border-dark-800 rounded-lg text-white placeholder:text-text-secondary focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
