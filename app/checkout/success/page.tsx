'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { formatPrice } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, XCircle, AlertCircle, Loader2, QrCode, Copy, ExternalLink, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTheme } from '@/components/providers/ThemeProvider'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isDark } = useTheme()
  
  const orderId = searchParams.get('order_id')
  const status = searchParams.get('status')
  const errorMessage = searchParams.get('message')

  const [loading, setLoading] = useState(true)
  const [orderData, setOrderData] = useState<any>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!orderId) {
      router.push('/events')
      return
    }

    verifyPayment()
  }, [orderId, router])

  const verifyPayment = async () => {
    setVerifying(true)
    try {
      const response = await fetch(`/api/orders/verify/${orderId}`)
      const data = await response.json()
      
      if (response.ok) {
        setOrderData(data)
        
        if (data.status === 'paid') {
          await fetch('/api/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status: 'success' }),
          })
        }
      }
    } catch (error) {
      console.error('Verification error:', error)
    } finally {
      setLoading(false)
      setVerifying(false)
    }
  }

  const handleDownloadTickets = () => {
    if (!orderData?.qrCodes) return

    const qrCodeList = orderData.qrCodes.flatMap((item: any) => 
      item.qrCode.split(',').map((code: string) => ({
        ticketName: item.ticketName,
        qrCode: code.trim()
      }))
    )

    const printContent = `<!DOCTYPE html>
<html>
<head>
  <title>Your Tickets - ${orderId}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .ticket { border: 2px dashed #333; padding: 20px; margin: 20px 0; page-break-inside: avoid; }
    .ticket-header { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .qr { margin: 20px 0; }
    .qr-code { font-family: monospace; font-size: 12px; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>Your Tickets</h1>
  <p>Order ID: ${orderId}</p>
  ${qrCodeList.map((item: any) => `
    <div class="ticket">
      <div class="ticket-header">${item.ticketName}</div>
      <div class="qr">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.qrCode)}" alt="QR Code" />
        <div class="qr-code">${item.qrCode}</div>
      </div>
    </div>
  `).join('')}
  <script>window.print()</script>
</body>
</html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  if (status === 'cancelled') {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center py-12">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-warning" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Cancelled</h1>
          <p className="text-gray-600 dark:text-text-secondary mb-6">
            Your payment was cancelled. Your tickets have been restored and are available for purchase again.
          </p>

          <div className="space-y-3">
            <Button variant="primary" className="w-full" onClick={() => router.push('/events')}>
              Browse Events
            </Button>
            <Link href="/user/tickets">
              <Button variant="ghost" className="w-full">
                View My Tickets
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center py-12">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-danger" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h1>
          <p className="text-gray-600 dark:text-text-secondary mb-2">
            {errorMessage || 'Payment failed. Please try again.'}
          </p>
          <p className="text-sm text-gray-500 dark:text-text-secondary mb-6">
            Your order is still active and you can retry the payment.
          </p>

          <div className="space-y-3">
            <Button variant="primary" className="w-full" onClick={() => router.push('/events')}>
              Browse Events
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => router.back()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center py-12">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Verifying Payment...</h2>
          <p className="text-gray-600 dark:text-text-secondary">Please wait while we confirm your payment.</p>
        </Card>
      </div>
    )
  }

  if (orderData?.status === 'paid' && orderData?.qrCodes) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center py-12">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-600 dark:text-text-secondary mb-6">
            Your tickets have been confirmed.
          </p>

          <div className="bg-gray-50 dark:bg-dark-900 rounded-lg p-3 mb-4 text-left">
            <p className="text-xs text-gray-500 dark:text-text-secondary">Order ID</p>
            <p className="text-gray-900 dark:text-white font-mono text-sm">{orderId}</p>
          </div>

          <div className="space-y-3 mb-6">
            {orderData.qrCodes.map((item: any, index: number) => {
              const qrCodes = item.qrCode.split(',').map((c: string) => c.trim())
              return (
                <div key={index} className="bg-gray-50 dark:bg-dark-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900 dark:text-white font-medium">{item.ticketName}</span>
                    <Badge variant="success">× {item.quantity}</Badge>
                  </div>
                  {qrCodes.map((qr: string, i: number) => (
                    <div key={i} className="bg-white p-2 rounded mt-2">
                      <QRCodeSVG value={qr} size={120} />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 dark:text-text-secondary mt-2 font-mono">
                    {item.qrCode}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="space-y-3">
            <Button variant="primary" className="w-full" onClick={handleDownloadTickets}>
              <Download className="w-4 h-4 mr-2" />
              Download Tickets
            </Button>
            <Link href="/user/tickets">
              <Button variant="secondary" className="w-full">
                View All Tickets
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center py-12">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-warning" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Pending</h1>
        <p className="text-gray-600 dark:text-text-secondary mb-6">
          Your payment is being processed. Please wait or check your payment status.
        </p>

        <Button variant="primary" onClick={verifyPayment} className="w-full">
          Check Payment Status
        </Button>
      </Card>
    </div>
  )
}

export default function CheckoutSuccessPage() {
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

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  )
}