import * as React from 'react'
import { cn } from '@/lib/utils'

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string
  error?: string
  value: string
  onChange: (value: string) => void
}

const formatNumber = (value: string): string => {
  const numericValue = value.replace(/[^0-9]/g, '')
  if (!numericValue) return ''
  return parseInt(numericValue, 10).toLocaleString('id-ID')
}

const parseNumber = (value: string): string => {
  return value.replace(/[^0-9]/g, '')
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, label, error, value, onChange, onBlur, onFocus, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value)
    const [isFocused, setIsFocused] = React.useState(false)

    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatNumber(value))
      }
    }, [value, isFocused])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      setDisplayValue(parseNumber(value))
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setDisplayValue(formatNumber(value))
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = parseNumber(e.target.value)
      onChange(rawValue)
      setDisplayValue(rawValue)
    }

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>}
        <input
          className={cn(
            'w-full px-4 py-3 bg-dark-900 border border-dark-800 rounded-lg text-white placeholder:text-text-secondary focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          inputMode="numeric"
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    )
  }
)
NumberInput.displayName = 'NumberInput'

export { NumberInput }