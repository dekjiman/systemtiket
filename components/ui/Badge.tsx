import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-dark-800 dark:text-white',
      success: 'bg-green-100 text-green-800 dark:bg-success/20 dark:text-success',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-warning/20 dark:text-warning',
      danger: 'bg-red-100 text-red-800 dark:bg-danger/20 dark:text-danger',
      primary: 'bg-blue-100 text-blue-800 dark:bg-primary-400/20 dark:text-primary-300',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
