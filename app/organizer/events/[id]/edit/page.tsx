'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, Upload, X, Eye, Image, Save, Loader2 } from 'lucide-react'

interface TicketType {
  name: string
  description: string
  price: string
  quantity: string
  maxPerOrder: string
}

interface LineupArtist {
  name: string
  role: 'headliner' | 'supporting' | 'opening'
  imageUrl: string
}

interface RundownItem {
  date: string
  time: string
  activity: string
  description: string
}

export default function EditEventPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [event, setEvent] = useState({
    title: '',
    description: '',
    venue: '',
    address: '',
    city: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    posterUrl: '',
    venueMapUrl: '',
    venueLatitude: '',
    venueLongitude: '',
  })

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: '', description: '', price: '', quantity: '', maxPerOrder: '4' }
  ])

  const [lineup, setLineup] = useState<LineupArtist[]>([
    { name: '', role: 'supporting', imageUrl: '' }
  ])

  const [rundown, setRundown] = useState<RundownItem[]>([
    { date: '', time: '', activity: '', description: '' }
  ])

  // Load event data
  useEffect(() => {
    if (eventId) {
      fetch(`/api/events/${eventId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            alert('Event not found')
            router.push('/organizer/events')
            return
          }

          // Parse dates
          const startDateObj = data.startDate ? new Date(data.startDate) : null
          const endDateObj = data.endDate ? new Date(data.endDate) : null

          setEvent({
            title: data.title || '',
            description: data.description || '',
            venue: data.venue || '',
            address: data.address || '',
            city: data.city || '',
            startDate: startDateObj ? startDateObj.toISOString().split('T')[0] : '',
            startTime: startDateObj ? startDateObj.toTimeString().slice(0, 5) : '',
            endDate: endDateObj ? endDateObj.toISOString().split('T')[0] : '',
            endTime: endDateObj ? endDateObj.toTimeString().slice(0, 5) : '',
            posterUrl: data.posterUrl || '',
            venueMapUrl: data.venueMapUrl || '',
            venueLatitude: data.venueLatitude || '',
            venueLongitude: data.venueLongitude || '',
          })

          if (data.posterUrl) {
            setPosterPreview(data.posterUrl)
          }

          // Load ticket types
          if (data.tickets && data.tickets.length > 0) {
            setTicketTypes(data.tickets.map((t: any) => ({
              name: t.name || '',
              description: t.description || '',
              price: String(t.price || ''),
              quantity: String(t.quantity || ''),
              maxPerOrder: String(t.maxPerOrder || '4'),
            })))
          }

          // Load lineup
          if (data.lineup) {
            try {
              const parsedLineup = JSON.parse(data.lineup)
              if (Array.isArray(parsedLineup) && parsedLineup.length > 0) {
                setLineup(parsedLineup)
              }
            } catch {
              // Keep default lineup
            }
          }

          // Load rundown
          if (data.rundown) {
            try {
              const parsedRundown = JSON.parse(data.rundown)
              if (Array.isArray(parsedRundown) && parsedRundown.length > 0) {
                setRundown(parsedRundown)
              }
            } catch {
              // Keep default rundown
            }
          }

          setLoading(false)
        })
        .catch(() => {
          alert('Failed to load event')
          router.push('/organizer/events')
        })
    }
  }, [eventId, router])

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', description: '', price: '', quantity: '', maxPerOrder: '4' }])
  }

  const removeTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index))
  }

  const updateTicketType = (index: number, field: keyof TicketType, value: string) => {
    const updated = [...ticketTypes]
    updated[index][field] = value
    setTicketTypes(updated)
  }

  // Lineup handlers
  const addLineupArtist = () => {
    setLineup([...lineup, { name: '', role: 'supporting', imageUrl: '' }])
  }

  const removeLineupArtist = (index: number) => {
    setLineup(lineup.filter((_, i) => i !== index))
  }

  const updateLineupArtist = (index: number, field: keyof LineupArtist, value: string) => {
    const updated = [...lineup]
    if (field === 'role') {
      updated[index].role = value as 'headliner' | 'supporting' | 'opening'
    } else {
      (updated[index] as any)[field] = value
    }
    setLineup(updated)
  }

  const handleLineupImageUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        updateLineupArtist(index, 'imageUrl', data.url)
      } else {
        alert('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    }
  }

  // Rundown handlers
  const addRundownItem = () => {
    setRundown([...rundown, { date: '', time: '', activity: '', description: '' }])
  }

  const removeRundownItem = (index: number) => {
    setRundown(rundown.filter((_, i) => i !== index))
  }

  const updateRundownItem = (index: number, field: keyof RundownItem, value: string) => {
    const updated = [...rundown]
    updated[index][field] = value
    setRundown(updated)
  }

  const moveRundownItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === rundown.length - 1) return

    const updated = [...rundown]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    setRundown(updated)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      setPosterPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setEvent({ ...event, posterUrl: data.url })
      } else {
        alert('Failed to upload image')
        setPosterPreview(null)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
      setPosterPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setPosterPreview(null)
    setEvent({ ...event, posterUrl: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          ticketTypes: ticketTypes.filter(t => t.name && t.price && t.quantity),
          lineup: lineup.filter(a => a.name).map(a => ({
            name: a.name,
            role: a.role,
            imageUrl: a.imageUrl,
          })),
          rundown: rundown.filter(r => r.time && r.activity).map(r => ({
            date: r.date,
            time: r.time,
            activity: r.activity,
            description: r.description,
          })),
        }),
      })

      if (response.ok) {
        router.push('/organizer/events')
      } else {
        alert('Failed to update event')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || !session || session.user.role !== 'organizer') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading event data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Event</h1>
          <p className="text-text-secondary">Update your event details</p>
        </div>
        <Button variant="ghost" onClick={() => router.push(`/events/${eventId}`)}>
          <Eye className="w-4 h-4 mr-2" />
          View Event
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white">Event Details</h2>

          <Input
            label="Event Title"
            value={event.title}
            onChange={(e) => setEvent({...event, title: e.target.value})}
            placeholder="Enter event title"
            required
          />

          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Description</label>
            <textarea
              value={event.description}
              onChange={(e) => setEvent({...event, description: e.target.value})}
              placeholder="Enter event description"
              rows={4}
              className="w-full px-4 py-3 bg-dark-900 border border-dark-800 rounded-lg text-white placeholder:text-text-secondary focus:outline-none focus:border-primary-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Venue"
              value={event.venue}
              onChange={(e) => setEvent({...event, venue: e.target.value})}
              placeholder="Venue name"
              required
            />
            <Input
              label="City"
              value={event.city}
              onChange={(e) => setEvent({...event, city: e.target.value})}
              placeholder="City"
              required
            />
          </div>

          <Input
            label="Address"
            value={event.address}
            onChange={(e) => setEvent({...event, address: e.target.value})}
            placeholder="Full address"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={event.startDate}
              onChange={(e) => setEvent({...event, startDate: e.target.value})}
              required
            />
            <Input
              label="Start Time"
              type="time"
              value={event.startTime}
              onChange={(e) => setEvent({...event, startTime: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="End Date"
              type="date"
              value={event.endDate}
              onChange={(e) => setEvent({...event, endDate: e.target.value})}
            />
            <Input
              label="End Time"
              type="time"
              value={event.endTime}
              onChange={(e) => setEvent({...event, endTime: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Event Poster</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {posterPreview ? (
              <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden bg-dark-900 border border-dark-800">
                <img
                  src={posterPreview}
                  alt="Poster preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-danger rounded-full text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-sm">Uploading...</div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-md mx-auto aspect-video rounded-lg border-2 border-dashed border-dark-700 hover:border-primary-500 transition-colors flex flex-col items-center justify-center gap-3 p-6 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-dark-800 group-hover:bg-dark-700 flex items-center justify-center transition-colors">
                  <Upload className="w-6 h-6 text-text-secondary group-hover:text-primary-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">Click to upload poster</p>
                  <p className="text-sm text-text-secondary mt-1">PNG, JPG up to 5MB</p>
                </div>
              </button>
            )}
          </div>
        </Card>

        <div className="flex justify-end mt-4">
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={saving}
            variant="primary"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Event Details
          </Button>
        </div>

        <Card className="p-6 space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Ticket Types</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addTicketType}>
              <Plus className="w-4 h-4 mr-2" />
              Add Ticket Type
            </Button>
          </div>

          {ticketTypes.map((ticket, index) => (
            <div key={index} className="p-4 bg-dark-900 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Ticket Type {index + 1}</h3>
                {ticketTypes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTicketType(index)}
                  >
                    <Trash2 className="w-4 h-4 text-danger" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Ticket Name"
                  value={ticket.name}
                  onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                  placeholder="e.g., VIP, Regular"
                  required
                />
                <Input
                  label="Price (IDR)"
                  type="number"
                  value={ticket.price}
                  onChange={(e) => updateTicketType(index, 'price', e.target.value)}
                  placeholder="50000"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={ticket.quantity}
                  onChange={(e) => updateTicketType(index, 'quantity', e.target.value)}
                  placeholder="100"
                  required
                />
                <Input
                  label="Max Per Order"
                  type="number"
                  value={ticket.maxPerOrder}
                  onChange={(e) => updateTicketType(index, 'maxPerOrder', e.target.value)}
                  placeholder="4"
                />
                <Input
                  label="Description"
                  value={ticket.description}
                  onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                  placeholder="What's included"
                />
              </div>
            </div>
          ))}
        </Card>

        <div className="flex justify-end mt-4">
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={saving}
            variant="primary"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Ticket Types
          </Button>
        </div>

        {/* Lineup Section */}
        <Card className="p-6 space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Lineup</h2>
              <p className="text-sm text-text-secondary">Add artists performing at this event</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addLineupArtist}>
              <Plus className="w-4 h-4 mr-2" />
              Add Artist
            </Button>
          </div>

          {lineup.map((artist, index) => (
            <div key={index} className="p-4 bg-dark-900 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Artist {index + 1}</h3>
                {lineup.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineupArtist(index)}
                  >
                    <Trash2 className="w-4 h-4 text-danger" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Artist Name"
                  value={artist.name}
                  onChange={(e) => updateLineupArtist(index, 'name', e.target.value)}
                  placeholder="Artist or band name"
                />
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Role</label>
                  <select
                    value={artist.role}
                    onChange={(e) => updateLineupArtist(index, 'role', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-primary-400"
                  >
                    <option value="headliner">Headliner</option>
                    <option value="supporting">Supporting Act</option>
                    <option value="opening">Opening Act</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-text-secondary">Artist Photo</label>
                {artist.imageUrl ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-dark-800 border-2 border-primary-400">
                    <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => updateLineupArtist(index, 'imageUrl', '')}
                      className="absolute top-0 right-0 p-1.5 bg-danger rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <label className="w-24 h-24 rounded-full border-2 border-dashed border-dark-700 hover:border-primary-500 transition-colors flex flex-col items-center justify-center cursor-pointer group bg-dark-900">
                      <Image className="w-8 h-8 text-text-secondary group-hover:text-primary-400" />
                      <span className="text-xs text-text-secondary mt-1">Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleLineupImageUpload(index, e.target.files[0])}
                      />
                    </label>
                    <p className="text-sm text-text-secondary">Click to upload artist photo</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Card>

        <div className="flex justify-end mt-4">
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={saving}
            variant="primary"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Lineup
          </Button>
        </div>

        {/* Venue Info Section */}
        <Card className="p-6 space-y-6 mt-6">
          <h2 className="text-xl font-semibold text-white">Venue Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Google Maps Embed URL"
              value={event.venueMapUrl}
              onChange={(e) => setEvent({...event, venueMapUrl: e.target.value})}
              placeholder="https://www.google.com/maps/embed?..."
            />
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">Or enter coordinates</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Latitude"
                  value={event.venueLatitude}
                  onChange={(e) => setEvent({...event, venueLatitude: e.target.value})}
                  placeholder="-6.2088"
                />
                <Input
                  label="Longitude"
                  value={event.venueLongitude}
                  onChange={(e) => setEvent({...event, venueLongitude: e.target.value})}
                  placeholder="106.8456"
                />
              </div>
            </div>
          </div>

          {event.venueMapUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-dark-900 border border-dark-800">
              <iframe
                src={event.venueMapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
        </Card>

        <div className="flex justify-end mt-4">
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={saving}
            variant="primary"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Venue Info
          </Button>
        </div>

        {/* Rundown Section */}
        <Card className="p-6 space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Event Rundown</h2>
              <p className="text-sm text-text-secondary">Schedule and timeline of the event</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addRundownItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </div>

          <div className="space-y-3">
            {rundown.map((item, index) => (
              <div key={index} className="p-4 bg-dark-900 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Schedule {index + 1}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveRundownItem(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveRundownItem(index, 'down')}
                      disabled={index === rundown.length - 1}
                    >
                      ↓
                    </Button>
                    {rundown.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRundownItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-danger" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    label="Date"
                    type="date"
                    value={item.date}
                    onChange={(e) => updateRundownItem(index, 'date', e.target.value)}
                  />
                  <Input
                    label="Time"
                    type="time"
                    value={item.time}
                    onChange={(e) => updateRundownItem(index, 'time', e.target.value)}
                  />
                  <Input
                    label="Activity"
                    value={item.activity}
                    onChange={(e) => updateRundownItem(index, 'activity', e.target.value)}
                    placeholder="e.g., Doors Open, Opening Act"
                  />
                  <Input
                    label="Description"
                    value={item.description}
                    onChange={(e) => updateRundownItem(index, 'description', e.target.value)}
                    placeholder="Additional details"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end mt-4">
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={saving}
            variant="primary"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Rundown
          </Button>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="ghost" onClick={() => router.push('/organizer/events')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
