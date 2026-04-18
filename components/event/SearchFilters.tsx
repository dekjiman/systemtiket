'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { SearchBar } from '@/components/ui/SearchBar'
import { Filter, X } from 'lucide-react'

const cities = ['All Cities', 'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali']
const genres = ['All Genres', 'Concert', 'Festival', 'Jazz', 'Rock', 'Electronic', 'Pop', 'Hip-Hop']

export function SearchFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentCity = searchParams.get('city') || ''
  const currentGenre = searchParams.get('genre') || ''
  const currentSearch = searchParams.get('search') || ''

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== `All ${key.charAt(0).toUpperCase() + key.slice(1)}s`) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const hasActiveFilters = currentCity || currentGenre || currentSearch

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <SearchBar
        placeholder="Search events, artists, venues..."
        onSearch={(value) => updateParams('search', value)}
        defaultValue={currentSearch}
      />

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* City Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-secondary" />
          <select
            value={currentCity}
            onChange={(e) => updateParams('city', e.target.value)}
            className="bg-dark-900 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-400"
          >
            {cities.map((city) => (
              <option key={city} value={city === 'All Cities' ? '' : city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Genre Filter */}
        <div className="flex items-center gap-2">
          <select
            value={currentGenre}
            onChange={(e) => updateParams('genre', e.target.value)}
            className="bg-dark-900 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-400"
          >
            {genres.map((genre) => (
              <option key={genre} value={genre === 'All Genres' ? '' : genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
