'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { CreditCard, Smartphone, Building, Shield, Check, AlertCircle, XCircle, Loader2, ShoppingCart } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

declare global {
  interface Window {
    snap: any
  }
}

interface CheckoutItem {
  ticketId: string
  ticketName: string
  price: number
  quantity: number
  eventId: string
  eventTitle: string
  eventDate: string
  eventVenue: string
}

function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { isDark } = useTheme()

  const orderId = searchParams.get('order_id')
  const cancelled = searchParams.get('cancelled')
  const errorMsg = searchParams.get('error')

  const [items, setItems] = useState<CheckoutItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('midtrans')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  })

  // Load Midtrans Snap script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-sYQ1BgHWe516P5Fj')
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    // Check auth
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout')
      return
    }

    if (status === 'loading') return

    // Fetch cart data
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        if (!data.items || data.items.length === 0) {
          router.push('/cart')
          return
        }

        // Transform cart items to checkout items
        const checkoutItems: CheckoutItem[] = data.items.map((item: any) => ({
          ticketId: item.ticketId,
          ticketName: item.ticketName,
          price: item.price || item.unitPrice,
          quantity: item.quantity,
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          eventDate: item.eventDate,
          eventVenue: item.eventVenue,
        }))

        setItems(checkoutItems)

        // Pre-fill from session
        if (session?.user) {
          setFormData({
            fullName: session.user.name || '',
            email: session.user.email || '',
            phone: session.user.phone || '',
          })
        }

        setLoading(false)
      })
      .catch(() => {
        router.push('/cart')
      })
  }, [status, session, router])

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const serviceFee = Math.round(subtotal * 0.03) // 3% service fee
  const total = subtotal + serviceFee

  const handlePayNow = async () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      alert('Please fill in all required fields')
      return
    }

    if (items.length === 0) {
      alert('No items in cart')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketItems: items.map(item => ({
            ticketId: item.ticketId,
            ticketName: item.ticketName,
            price: item.price,
            quantity: item.quantity,
          })),
          customerInfo: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order')
      }

      // Initialize Snap popup
      if (data.snapToken && window.snap) {
        window.snap.pay(data.snapToken, {
          onSuccess: (result: any) => {
            // Redirect to success page
            router.push(`/checkout/success?order_id=${data.orderId}&status=success`)
          },
          onPending: (result: any) => {
            // Payment pending - show message
            alert('Payment pending. Please complete payment.')
            setSubmitting(false)
          },
          onError: (result: any) => {
            // Payment error/failed
            router.push(`/checkout/success?order_id=${data.orderId}&status=error&message=${encodeURIComponent(result.status_message || 'Payment failed')}`)
          },
          onClose: () => {
            // User closed Snap popup without completing
            // Don't redirect - let user decide to retry or not
            setSubmitting(false)
          },
        })
      } else {
        throw new Error('Failed to initialize payment')
      }
    } catch (error: any) {
      alert(error.message || 'Something went wrong')
      setSubmitting(false)
    }
  }

  // Show cancelled message
if (cancelled === 'true') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Cancelled</h1>
          <p className="text-gray-600 dark:text-text-secondary mb-6">
            Your payment was cancelled. Your tickets have been restored and are available for purchase again.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={() => router.push('/cart')}>
              View Cart
            </Button>
            <Button variant="primary" onClick={() => router.push('/events')}>
              Browse Events
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Show error message
  if (errorMsg) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-danger" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h1>
          <p className="text-gray-600 dark:text-text-secondary mb-2">
            {decodeURIComponent(errorMsg)}
          </p>
          <p className="text-sm text-gray-500 dark:text-text-secondary mb-6">
            You can try again or choose a different payment method.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={() => router.push('/cart')}>
              View Cart
            </Button>
            <Button variant="primary" onClick={() => router.push('/events')}>
              Browse Events
            </Button>
          </div>
        </Card>
      </div>
    )
  }
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 py-12">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-900/50 backdrop-blur-sm mb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JM</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">JustMine</span>
          </Link>
          <PublicHeader />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+62 812-3456-7890"
                  required
                />
              </div>
            </Card>

            {/* Payment Method - Hidden for now, using Midtrans only */}
            {/* <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'midtrans', name: 'Credit/Debit Card & E-Wallet', icon: CreditCard },
                  { id: 'xendit', name: 'All Payment Methods', icon: Building },
                  { id: 'manual', name: 'Bank Transfer (Manual)', icon: Smartphone },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      paymentMethod === method.id
                        ? 'border-primary-400 bg-primary-400/10'
                        : 'border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <method.icon className="w-6 h-6 text-primary-400" />
                      <span className="font-medium text-white">{method.name}</span>
                      {paymentMethod === method.id && (
                        <Check className="w-5 h-5 text-primary-400 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-2 text-sm text-text-secondary">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Your payment is secured with 256-bit SSL encryption</p>
              </div>
            </Card> */}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>

                {/* Events Info */}
                {items.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-dark-800">
                    {items.map((item, idx) => (
                      <div key={idx} className="mb-2">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{item.eventTitle}</p>
                        <p className="text-xs text-gray-500 dark:text-text-secondary">
                          {item.eventDate ? format(new Date(item.eventDate), 'MMM dd, yyyy • HH:mm') : ''}
                          {item.eventVenue && ` • ${item.eventVenue}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-dark-800">
                  {items.map((item) => (
                    <div key={item.ticketId} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-text-secondary">
                        {item.ticketName} × {item.quantity}
                      </span>
                      <span className="text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-text-secondary">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-text-secondary">Service Fee (3%)</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(serviceFee)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-dark-800">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mt-6"
                  onClick={handlePayNow}
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : `Pay ${formatPrice(total)}`}
                </Button>

                <p className="text-xs text-gray-500 dark:text-text-secondary text-center mt-3">
                  By completing this purchase, you agree to our Terms of Service
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center"><div className="text-gray-900 dark:text-white">Loading...</div></div>}>
      <CheckoutForm />
    </Suspense>
  )
}
