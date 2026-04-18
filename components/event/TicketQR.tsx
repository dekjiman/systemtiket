'use client'

import QRCode from 'qrcode.react'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface TicketQRProps {
  qrCode: string
  ticketCode: string
  eventTitle: string
  attendeeName: string
  ticketType: string
}

export function TicketQR({ qrCode, ticketCode, eventTitle, attendeeName, ticketType }: TicketQRProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">{eventTitle}</h3>
        <p className="text-sm text-text-secondary mb-6">
          {attendeeName} • {ticketType}
        </p>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg inline-block mb-4">
          <QRCode
            value={qrCode}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Ticket Code */}
        <div className="mb-4">
          <p className="text-sm text-text-secondary mb-1">Ticket Code</p>
          <div className="flex items-center justify-center gap-2">
            <code className="bg-dark-800 px-3 py-2 rounded font-mono text-white">
              {ticketCode}
            </code>
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <p className="text-xs text-text-secondary">
          Present this QR code at the venue entrance
        </p>
      </div>
    </Card>
  )
}
