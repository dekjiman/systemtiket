'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { useTheme } from '@/components/providers/ThemeProvider'

interface ScanResult {
  valid: boolean
  message: string
  ticketInfo?: {
    event: string
    attendee: string
    ticketType: string
  }
}

export default function CheckInPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isDark } = useTheme()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setScanning(true)
        setPermission('granted')
      }
    } catch (error) {
      console.error('Camera access denied:', error)
      setPermission('denied')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setScanning(false)
    }
  }

  const simulateScan = () => {
    stopCamera()
    setResult({
      valid: true,
      message: 'Ticket verified successfully!',
      ticketInfo: {
        event: 'Summer Sonic Festival 2024',
        attendee: 'John Doe',
        ticketType: 'VIP',
      },
    })
  }

  const resetScan = () => {
    setResult(null)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 py-8">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-900/50 backdrop-blur-sm mb-8">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JM</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">JustMine</span>
          </Link>
          <PublicHeader />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Check-in Scanner</h1>
          <p className="text-gray-600 dark:text-text-secondary">Scan QR codes from tickets to validate entry</p>
        </div>

        {!scanning && !result && (
          <Card className="p-8 text-center">
            <div className="w-24 h-24 bg-primary-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-12 h-12 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Start Scanning</h2>
            <p className="text-gray-600 dark:text-text-secondary mb-6">
              {permission === 'denied'
                ? 'Camera access is required to scan tickets'
                : 'Allow camera access to scan QR codes'}
            </p>
            {permission === 'denied' ? (
              <Button variant="secondary" onClick={() => alert('Please enable camera in settings')}>
                Enable Camera
              </Button>
            ) : (
              <Button variant="primary" onClick={startCamera}>
                Start Camera
              </Button>
            )}
          </Card>
        )}

        {scanning && !result && (
          <Card className="p-4">
            <div className="relative aspect-video bg-black dark:bg-dark-900 rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-primary-400/50 rounded-lg relative">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary-400 transform rotate-45" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary-400 transform rotate-45" />
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-400 transform rotate-45" />
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-400 transform rotate-45" />
                </div>
              </div>
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-full h-1 bg-primary-400/50 animate-[scan_2s_ease-in-out_infinite] absolute" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={stopCamera}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" onClick={simulateScan}>
                Simulate Scan
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-text-secondary text-center mt-3">
              Position QR code within the frame
            </p>
          </Card>
        )}

        {result && (
          <Card className="p-6">
            <div className="text-center">
              {result.valid ? (
                <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-danger" />
                </div>
              )}

              <Badge variant={result.valid ? 'success' : 'danger'} className="mb-4">
                {result.valid ? 'Valid Ticket' : 'Invalid Ticket'}
              </Badge>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {result.message}
              </h2>

              {result.ticketInfo && (
                <div className="bg-gray-100 dark:bg-dark-900 rounded-lg p-4 mt-6 text-left">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-text-secondary">Event</span>
                      <p className="text-gray-900 dark:text-white font-medium">{result.ticketInfo.event}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-text-secondary">Attendee</span>
                      <p className="text-gray-900 dark:text-white font-medium">{result.ticketInfo.attendee}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-text-secondary">Ticket Type</span>
                      <p className="text-gray-900 dark:text-white font-medium">{result.ticketInfo.ticketType}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button variant="primary" className="flex-1" onClick={resetScan}>
                  Scan Another
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setResult(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!scanning && !result && (
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today&apos;s Check-ins</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-100 dark:bg-dark-900 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                <p className="text-sm text-gray-600 dark:text-text-secondary">Scanned</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">0</p>
                <p className="text-sm text-gray-600 dark:text-text-secondary">Valid</p>
              </div>
              <div className="text-center p-4 bg-danger/10 rounded-lg">
                <p className="text-2xl font-bold text-danger">0</p>
                <p className="text-sm text-gray-600 dark:text-text-secondary">Invalid</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
