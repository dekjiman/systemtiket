import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-card p-4 shadow-sm dark:shadow-soft',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

export { Card }
