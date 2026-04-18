import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Clock, Tag, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export interface EventCardProps {
  event: {
    id: string
    slug?: string
    title: string
    artist: string
    date: string
    time: string
    venue: string
    city: string
    price: number
    poster?: string
    soldOut: boolean
    tags: string[]
  }
}

export function EventCard({ event }: EventCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM dd, yyyy')
  }

  const hasPoster = event.poster && event.poster.trim() !== ''

  return (
    <Link href={`/events/${event.slug || event.id}`}>
      <Card className="group h-full overflow-hidden hover:border-primary-400/50 transition-all duration-300 hover:shadow-glow">
        {/* Poster */}
        <div className="relative aspect-[4/5] bg-dark-800 overflow-hidden rounded-t-lg">
          {hasPoster ? (
            <img
              src={event.poster?.startsWith('http') ? event.poster : (event.poster?.startsWith('/') ? event.poster : '/' + event.poster)}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-400/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl">🎵</span>
            </div>
          )}

          {/* Sold Out Badge */}
          {event.soldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="danger">Sold Out</Badge>
            </div>
          )}

          {/* Tags */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {event.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="primary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <p className="text-sm text-primary-400 font-medium">{event.artist}</p>
          <h3 className="font-semibold text-white line-clamp-2 group-hover:text-primary-300 transition-colors">
            {event.title}
          </h3>

          <div className="space-y-1 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.venue}, {event.city}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-dark-800 flex items-center justify-between">
            <span className="text-lg font-bold text-white">{formatPrice(event.price)}</span>
            <span className="text-sm text-text-secondary">per ticket</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}