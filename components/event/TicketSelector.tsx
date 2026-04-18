'use client'

import { Minus, Plus, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/components/providers/ThemeProvider'

interface Ticket {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  sold: number
  maxPerOrder: number
  isActive: boolean
}

interface TicketSelectorProps {
  tickets: Ticket[]
  selectedTickets: Record<string, number>
  onSelectionChange: (selection: Record<string, number>) => void
}

export function TicketSelector({ tickets, selectedTickets, onSelectionChange }: TicketSelectorProps) {
  const { isDark } = useTheme()

  const updateQuantity = (ticketId: string, delta: number) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) return

    const currentQty = selectedTickets[ticketId] || 0
    const newQty = currentQty + delta

    if (newQty < 0) return
    if (newQty > ticket.quantity - ticket.sold) return
    if (newQty > ticket.maxPerOrder) return

    if (newQty === 0) {
      const { [ticketId]: _, ...rest } = selectedTickets
      onSelectionChange(rest)
    } else {
      onSelectionChange({ ...selectedTickets, [ticketId]: newQty })
    }
  }

  const soldPercentage = (sold: number, quantity: number) => {
    return quantity > 0 ? (sold / quantity) * 100 : 0
  }

  const isSoldOut = (ticket: Ticket) => {
    return ticket.sold >= ticket.quantity
  }

  return (
    <div className="space-y-4">
      {tickets
        .filter(t => t.isActive)
        .map((ticket) => {
          const selectedQty = selectedTickets[ticket.id] || 0
          const soldOut = isSoldOut(ticket)
          const available = ticket.quantity - ticket.sold - selectedQty
          const progress = soldPercentage(ticket.sold + selectedQty, ticket.quantity)

          return (
            <Card key={ticket.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{ticket.name}</h4>
                    {soldOut && <Badge variant="danger">Sold Out</Badge>}
                    {progress >= 80 && !soldOut && <Badge variant="warning">Low Stock</Badge>}
                  </div>
                  {ticket.description && (
                    <p className="text-sm text-gray-600 dark:text-text-secondary">{ticket.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(ticket.price)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-text-secondary">
                    {available} remaining
                  </p>
                </div>
              </div>

              {/* Stock Progress Bar */}
              <div className="mb-3 h-1.5 bg-gray-200 dark:bg-dark-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    progress >= 90
                      ? 'bg-danger'
                      : progress >= 70
                      ? 'bg-warning'
                      : 'bg-primary-400'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => updateQuantity(ticket.id, -1)}
                    disabled={selectedQty === 0 || soldOut}
                    className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 flex items-center justify-center text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center font-semibold text-gray-900 dark:text-white text-lg">
                    {selectedQty}
                  </span>
                  <button
                    onClick={() => updateQuantity(ticket.id, 1)}
                    disabled={selectedQty >= ticket.maxPerOrder || soldOut || available <= 0}
                    className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 flex items-center justify-center text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-text-secondary">
                    Max {ticket.maxPerOrder} per order
                  </p>
                  {selectedQty > 0 && (
                    <p className="text-sm text-primary-400 font-medium">
                      Subtotal: {formatPrice(ticket.price * selectedQty)}
                    </p>
                  )}
                </div>
              </div>

              {/* Sold out / Low stock warning */}
              {soldOut ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-danger">
                  <AlertCircle className="w-4 h-4" />
                  This ticket type is sold out
                </div>
              ) : available <= 5 && available > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-warning">
                  <AlertCircle className="w-4 h-4" />
                  Only {available} tickets left!
                </div>
              )}
            </Card>
          )
        })}
    </div>
  )
}
