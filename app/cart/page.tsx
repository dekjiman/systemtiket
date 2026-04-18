'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ShoppingCart, Trash2, Minus, Plus, Calendar, MapPin, Loader2, ArrowRight, Ticket, Clock, AlertTriangle } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

interface CartItem {
  id: string
  eventId: string
  ticketId: string
  quantity: number
  unitPrice: number
  ticketName: string
  eventTitle: string
  eventDate: string
  eventVenue: string
  totalPrice: number
}

interface CartSummary {
  itemCount: number
  subtotal: number
  serviceFee: number
  total: number
  expiresAt?: string
}

export default function CartPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { isDark } = useTheme()
  const [items, setItems] = useState<CartItem[]>([])
  const [summary, setSummary] = useState<CartSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchCart()
    }
  }, [status, router])

  useEffect(() => {
    if (!summary?.expiresAt) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expires = new Date(summary.expiresAt!).getTime()
      const diff = expires - now
      return diff > 0 ? Math.floor(diff / 1000) : 0
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      if (remaining <= 0) {
        setExpired(true)
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [summary?.expiresAt])

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart')
      const data = await res.json()
      
      if (res.ok) {
        setItems(data.items || [])
        setSummary(data.summary || null)
        if (data.cart?.expiresAt) {
          setTimeLeft(null)
          setExpired(false)
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return
    
    setUpdating(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity }),
      })

      if (res.ok) {
        fetchCart()
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to update quantity')
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
    } finally {
      setUpdating(false)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!confirm('Remove this item from cart?')) return
    
    setUpdating(true)
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchCart()
      }
    } catch (error) {
      console.error('Error removing item:', error)
    } finally {
      setUpdating(false)
    }
  }

  const clearCart = async () => {
    if (!confirm('Clear all items from cart?')) return
    
    setUpdating(true)
    try {
      const res = await fetch('/api/cart?clear=true', {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchCart()
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
    } finally {
      setUpdating(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleCheckout = () => {
    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  if (expired || (timeLeft !== null && timeLeft <= 0)) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950">
        <div className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-900/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">JM</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">JustMine</span>
            </Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Card className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Cart Expired</h2>
            <p className="text-gray-600 dark:text-text-secondary mb-6">Your cart has expired. Please book again.</p>
            <Link href="/events">
              <Button variant="primary">Browse Events</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JM</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">JustMine</span>
          </Link>
          <Link href="/events">
            <Button variant="ghost">Browse Events</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
          {items.length > 0 && (
            <Button variant="ghost" onClick={clearCart} disabled={updating}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 dark:text-text-secondary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-600 dark:text-text-secondary mb-6">Browse events and add tickets to your cart</p>
            <Link href="/events">
              <Button variant="primary">Browse Events</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.eventTitle}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600 dark:text-text-secondary">
                        <Badge variant="primary">{item.ticketName}</Badge>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {item.eventDate ? format(new Date(item.eventDate), 'MMM dd, yyyy') : 'TBA'}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {item.eventVenue || 'TBA'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={updating || item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center text-gray-900 dark:text-white font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updating}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatPrice(item.totalPrice)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-text-secondary">
                          {formatPrice(item.unitPrice)} each
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={updating}
                        className="text-danger hover:text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-text-secondary">
                      Tickets ({summary?.itemCount || 0})
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatPrice(summary?.subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-text-secondary">Service Fee (3%)</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatPrice(summary?.serviceFee || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-dark-800">
                    <span className="text-gray-900 dark:text-white font-medium">Total</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(summary?.total || 0)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-xs text-gray-500 dark:text-text-secondary text-center mt-4 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  {timeLeft !== null ? (
                    <span className={timeLeft < 60 ? 'text-warning' : ''}>
                      Expires in {formatTimeLeft(timeLeft)}
                    </span>
                  ) : (
                    'Cart expires in 10 minutes'
                  )}
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}