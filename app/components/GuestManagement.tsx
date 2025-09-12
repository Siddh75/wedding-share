'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Users, Mail, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Guest {
  id: string
  guest_id: string
  guest_name: string
  guest_email: string
  status: string
  invited_at: string
  responded_at?: string
  rsvp_status?: 'yes' | 'no' | 'maybe'
  dietary_restrictions?: string
  plus_one: boolean
  plus_one_name?: string
}

interface GuestManagementProps {
  weddingId: string
  userRole?: string
}

export default function GuestManagement({ weddingId, userRole = 'guest' }: GuestManagementProps) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'yes' | 'no' | 'maybe' | 'pending'>('all')
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    guestEmail: '',
    guestName: '',
    plusOne: false,
    plusOneName: ''
  })

  useEffect(() => {
    fetchGuests()
  }, [weddingId])

  const fetchGuests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/guests?weddingId=${weddingId}`)
      const result = await response.json()

      if (result.success) {
        setGuests(result.guests)
      } else {
        toast.error('Failed to load guests')
      }
    } catch (error) {
      toast.error('Failed to load guests')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId,
          guestEmail: inviteForm.guestEmail,
          guestName: inviteForm.guestName,
          plusOne: inviteForm.plusOne,
          plusOneName: inviteForm.plusOneName
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Guest invited successfully!')
        setShowInviteForm(false)
        setInviteForm({
          guestEmail: '',
          guestName: '',
          plusOne: false,
          plusOneName: ''
        })
        fetchGuests() // Refresh the list
      } else {
        toast.error(result.message || 'Failed to invite guest')
      }
    } catch (error) {
      toast.error('Failed to invite guest')
    }
  }

  const handleRSVPUpdate = async (invitationId: string, rsvpStatus: 'yes' | 'no' | 'maybe', dietaryRestrictions?: string) => {
    try {
      const response = await fetch('/api/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          rsvpStatus,
          dietaryRestrictions
        })
      })

      const result = await response.json()

      if (result.success) {
        setGuests(prev => prev.map(guest => 
          guest.id === invitationId 
            ? { 
                ...guest, 
                rsvp_status: rsvpStatus, 
                responded_at: new Date().toISOString(),
                dietary_restrictions: dietaryRestrictions
              }
            : guest
        ))
        toast.success('RSVP updated successfully!')
      } else {
        toast.error(result.message || 'Failed to update RSVP')
      }
    } catch (error) {
      toast.error('Failed to update RSVP')
    }
  }

  const handleRemoveGuest = async (invitationId: string) => {
    if (!confirm('Are you sure you want to remove this guest?')) return

    try {
      const response = await fetch(`/api/guests?invitationId=${invitationId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setGuests(prev => prev.filter(guest => guest.id !== invitationId))
        toast.success('Guest removed successfully!')
      } else {
        toast.error(result.message || 'Failed to remove guest')
      }
    } catch (error) {
      toast.error('Failed to remove guest')
    }
  }

  const canInviteGuests = () => {
    return userRole === 'super_admin' || userRole === 'admin'
  }

  const canRemoveGuests = () => {
    return userRole === 'super_admin' || userRole === 'admin'
  }

  const getRSVPColor = (status?: string) => {
    switch (status) {
      case 'yes': return 'text-green-600 bg-green-100'
      case 'no': return 'text-red-600 bg-red-100'
      case 'maybe': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRSVPIcon = (status?: string) => {
    switch (status) {
      case 'yes': return <CheckCircle className="h-4 w-4" />
      case 'no': return <XCircle className="h-4 w-4" />
      case 'maybe': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredGuests = guests.filter(guest => {
    if (filter === 'all') return true
    if (filter === 'pending') return !guest.rsvp_status
    return guest.rsvp_status === filter
  })

  const stats = {
    total: guests.length,
    yes: guests.filter(g => g.rsvp_status === 'yes').length,
    no: guests.filter(g => g.rsvp_status === 'no').length,
    maybe: guests.filter(g => g.rsvp_status === 'maybe').length,
    pending: guests.filter(g => !g.rsvp_status).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Guest Management</h2>
          <p className="text-gray-600">Manage your wedding guest list and RSVPs</p>
        </div>
        {canInviteGuests() && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Guest
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Attending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.yes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Declined</p>
              <p className="text-2xl font-bold text-gray-900">{stats.no}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Maybe</p>
              <p className="text-2xl font-bold text-gray-900">{stats.maybe}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-pink-100 text-pink-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('yes')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'yes' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Attending ({stats.yes})
        </button>
        <button
          onClick={() => setFilter('no')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'no' 
              ? 'bg-red-100 text-red-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Declined ({stats.no})
        </button>
        <button
          onClick={() => setFilter('maybe')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'maybe' 
              ? 'bg-yellow-100 text-yellow-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Maybe ({stats.maybe})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'pending' 
              ? 'bg-gray-100 text-gray-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending ({stats.pending})
        </button>
      </div>

      {/* Guest List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Guest List</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredGuests.map((guest) => (
            <div key={guest.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {guest.guest_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {guest.guest_name}
                        {guest.plus_one && guest.plus_one_name && (
                          <span className="text-gray-500 ml-2">+ {guest.plus_one_name}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{guest.guest_email}</p>
                      {guest.dietary_restrictions && (
                        <p className="text-xs text-gray-400 mt-1">
                          Dietary: {guest.dietary_restrictions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* RSVP Status */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getRSVPColor(guest.rsvp_status)}`}>
                    {getRSVPIcon(guest.rsvp_status)}
                    <span className="capitalize">{guest.rsvp_status || 'Pending'}</span>
                  </div>

                  {/* RSVP Actions (for guests) */}
                  {userRole === 'guest' && !guest.rsvp_status && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRSVPUpdate(guest.id, 'yes')}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleRSVPUpdate(guest.id, 'maybe')}
                        className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                      >
                        Maybe
                      </button>
                      <button
                        onClick={() => handleRSVPUpdate(guest.id, 'no')}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  )}

                  {/* Remove Button (for admins) */}
                  {canRemoveGuests() && (
                    <button
                      onClick={() => handleRemoveGuest(guest.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Invite Guest</h3>
              <button
                onClick={() => setShowInviteForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleInviteGuest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guest Email *
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.guestEmail}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, guestEmail: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                  placeholder="guest@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.guestName}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, guestName: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="plusOne"
                  checked={inviteForm.plusOne}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, plusOne: e.target.checked }))}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="plusOne" className="ml-2 text-sm text-gray-700">
                  Allow plus one
                </label>
              </div>
              
              {inviteForm.plusOne && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plus One Name
                  </label>
                  <input
                    type="text"
                    value={inviteForm.plusOneName}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, plusOneName: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="Jane Doe"
                  />
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
