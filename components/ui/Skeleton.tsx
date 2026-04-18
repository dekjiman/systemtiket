import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-dark-800',
        className
      )}
    />
  )
}

export function EventCardSkeleton() {
  return (
    <div className="bg-dark-900 rounded-card border border-dark-800 overflow-hidden">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-2 border-t border-dark-800 flex justify-between">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  )
}

export function TicketSkeleton() {
  return (
    <div className="p-4 bg-dark-900 rounded-lg border border-dark-800 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      <Skeleton className="h-1.5 w-full" />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  )
}
