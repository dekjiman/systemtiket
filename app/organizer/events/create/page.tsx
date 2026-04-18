'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NumberInput } from '@/components/ui/NumberInput'
import { Plus, Trash2, Upload, X, MapPin, Clock, User, Image, Save, Loader2, CheckCircle } from 'lucide-react'

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

export default function CreateEventPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [eventId, setEventId] = useState<string | null>(null)
  const [savedSections, setSavedSections] = useState<{
    details: boolean
    tickets: boolean
    lineup: boolean
    venue: boolean
    rundown: boolean
  }>({
    details: false,
    tickets: false,
    lineup: false,
    venue: false,
    rundown: false,
  })
  const [savingSection, setSavingSection] = useState<string | null>(null)
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
    setLoading(true)

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
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
        const data = await response.json()
        router.push(`/organizer/events`)
      } else {
        alert('Failed to create event')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  // Save handlers for each section
  const saveEventDetails = async () => {
    if (!event.title || !event.venue || !event.address || !event.city || !event.startDate) {
      alert('Please fill in all required fields')
      return
    }

    setSavingSection('details')
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          ticketTypes: [],
          lineup: [],
          rundown: [],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEventId(data.eventId)
        setSavedSections(prev => ({ ...prev, details: true }))
        alert('Event details saved!')
      } else {
        alert('Failed to save event details')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to save event details')
    } finally {
      setSavingSection(null)
    }
  }

  const saveTicketTypes = async () => {
    if (!eventId) {
      alert('Please save event details first')
      return
    }

    const validTickets = ticketTypes.filter(t => t.name && t.price && t.quantity)
    if (validTickets.length === 0) {
      alert('Please add at least one ticket type')
      return
    }

    setSavingSection('tickets')
    try {
      const response = await fetch(`/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketTypes: ticketTypes }),
      })

      if (response.ok) {
        setSavedSections(prev => ({ ...prev, tickets: true }))
        alert('Ticket types saved!')
      } else {
        alert('Failed to save ticket types')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to save ticket types')
    } finally {
      setSavingSection(null)
    }
  }

  const saveLineup = async () => {
    if (!eventId) {
      alert('Please save event details first')
      return
    }

    setSavingSection('lineup')
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineup: lineup.filter(a => a.name).map(a => ({
            name: a.name,
            role: a.role,
            imageUrl: a.imageUrl,
          })),
        }),
      })

      if (response.ok) {
        setSavedSections(prev => ({ ...prev, lineup: true }))
        alert('Lineup saved!')
      } else {
        alert('Failed to save lineup')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to save lineup')
    } finally {
      setSavingSection(null)
    }
  }

  const saveVenueInfo = async () => {
    if (!eventId) {
      alert('Please save event details first')
      return
    }

    setSavingSection('venue')
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue: event.venue,
          address: event.address,
          city: event.city,
          venueMapUrl: event.venueMapUrl,
          venueLatitude: event.venueLatitude,
          venueLongitude: event.venueLongitude,
        }),
      })

      if (response.ok) {
        setSavedSections(prev => ({ ...prev, venue: true }))
        alert('Venue info saved!')
      } else {
        alert('Failed to save venue info')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to save venue info')
    } finally {
      setSavingSection(null)
    }
  }

  const saveRundown = async () => {
    if (!eventId) {
      alert('Please save event details first')
      return
    }

    setSavingSection('rundown')
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rundown: rundown.filter(r => r.time && r.activity).map(r => ({
            date: r.date,
            time: r.time,
            activity: r.activity,
            description: r.description,
          })),
        }),
      })

      if (response.ok) {
        setSavedSections(prev => ({ ...prev, rundown: true }))
        alert('Rundown saved!')
      } else {
        alert('Failed to save rundown')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to save rundown')
    } finally {
      setSavingSection(null)
    }
  }

  const generateMapUrl = () => {
    if (!event.venue || !event.address) {
      alert('Please fill in venue and address first')
      return
    }
    const query = encodeURIComponent(`${event.venue}, ${event.address}, ${event.city}`)
    const embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1d!2d1e!3d-1!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMwKwNCcgMDAuMCJFIENPDVUgQU5EIERBVEEgS0lUQU4!5e0!3m2!1sen!2sid!4v1`
    
    // Use search embed instead of direct embed
    const searchUrl = `https://www.google.com/maps?q=${query}&output=embed`
    setEvent({ ...event, venueMapUrl: searchUrl })
    alert('Map URL generated!')
  }

  if (status === 'loading' || !session || session.user.role !== 'organizer') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Create Event</h1>
        <p className="text-text-secondary">Create a new event</p>
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
            onClick={saveEventDetails} 
            disabled={savingSection === 'details'}
            variant={savedSections.details ? 'secondary' : 'primary'}
          >
            {savingSection === 'details' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : savedSections.details ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {savedSections.details ? 'Saved' : 'Save Event Details'}
          </Button>
        </div>

        <Card className="p-6 space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Ticket Types</h2>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                onClick={saveTicketTypes} 
                disabled={savingSection === 'tickets'}
                variant={savedSections.tickets ? 'ghost' : 'primary'}
                size="sm"
              >
                {savingSection === 'tickets' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : savedSections.tickets ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {savedSections.tickets ? 'Saved' : 'Save'}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={addTicketType}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
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
                <NumberInput
                  label="Price (IDR)"
                  value={ticket.price}
                  onChange={(value) => updateTicketType(index, 'price', value)}
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
            onClick={saveTicketTypes} 
            disabled={savingSection === 'tickets'}
            variant={savedSections.tickets ? 'secondary' : 'primary'}
          >
            {savingSection === 'tickets' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : savedSections.tickets ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {savedSections.tickets ? 'Saved' : 'Save Ticket Types'}
          </Button>
        </div>

        {/* Lineup Section */}
        <Card className="p-6 space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Lineup</h2>
              <p className="text-sm text-text-secondary">Add artists performing at this event</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                onClick={saveLineup} 
                disabled={savingSection === 'lineup'}
                variant={savedSections.lineup ? 'ghost' : 'primary'}
                size="sm"
              >
                {savingSection === 'lineup' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : savedSections.lineup ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {savedSections.lineup ? 'Saved' : 'Save'}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={addLineupArtist}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
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
            onClick={saveLineup} 
            disabled={savingSection === 'lineup'}
            variant={savedSections.lineup ? 'secondary' : 'primary'}
          >
            {savingSection === 'lineup' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : savedSections.lineup ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {savedSections.lineup ? 'Saved' : 'Save Lineup'}
          </Button>
        </div>

        {/* Venue Info Section */}
        <Card className="p-6 space-y-6 mt-6">
          <h2 className="text-xl font-semibold text-white">Venue Information</h2>
          
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              onClick={generateMapUrl}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Generate Map
            </Button>
          </div>
          
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
            onClick={saveVenueInfo} 
            disabled={savingSection === 'venue'}
            variant={savedSections.venue ? 'secondary' : 'primary'}
          >
            {savingSection === 'venue' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : savedSections.venue ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {savedSections.venue ? 'Saved' : 'Save Venue Info'}
          </Button>
        </div>

        {/* Rundown Section */}
        <Card className="p-6 space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Event Rundown</h2>
              <p className="text-sm text-text-secondary">Schedule and timeline of the event</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                onClick={saveRundown} 
                disabled={savingSection === 'rundown'}
                variant={savedSections.rundown ? 'ghost' : 'primary'}
                size="sm"
              >
                {savingSection === 'rundown' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : savedSections.rundown ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {savedSections.rundown ? 'Saved' : 'Save'}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={addRundownItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
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
            onClick={saveRundown} 
            disabled={savingSection === 'rundown'}
            variant={savedSections.rundown ? 'secondary' : 'primary'}
          >
            {savingSection === 'rundown' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : savedSections.rundown ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {savedSections.rundown ? 'Saved' : 'Save Rundown'}
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