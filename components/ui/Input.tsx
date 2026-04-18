import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">{label}</label>}
        <input
          className={cn(
            'w-full px-4 py-3 bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-800 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-text-secondary focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
