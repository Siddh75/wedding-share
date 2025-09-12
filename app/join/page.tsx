'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

interface WeddingDetails {
  id: string
  name: string
  date: string
  location: string
  description: string
}

interface GuestDetails {
  id: string
  guest_name: string
  guest_email: string
  rsvp_status: string
  plus_one: boolean
  plus_one_name: string | null
}

export default function JoinPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wedding, setWedding] = useState<WeddingDetails | null>(null)
  const [guest, setGuest] = useState<GuestDetails | null>(null)
  const [rsvpStatus, setRsvpStatus] = useState('')
  const [plusOneName, setPlusOneName] = useState('')
  const [dietaryRestrictions, setDietaryRestrictions] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const weddingId = searchParams.get('wedding')
  const guestId = searchParams.get('guest')

  useEffect(() => {
    if (!weddingId || !guestId) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    loadWeddingAndGuest()
  }, [weddingId, guestId])

  const loadWeddingAndGuest = async () => {
    try {
      // Load wedding details
      const { data: weddingData, error: weddingError } = await supabase
        .from('weddings')
        .select('id, name, date, location, description')
        .eq('id', weddingId)
        .single()

      if (weddingError) throw weddingError

      // Load guest details
      const { data: guestData, error: guestError } = await supabase
        .from('wedding_guests')
        .select('id, guest_name, guest_email, rsvp_status, plus_one, plus_one_name, dietary_restrictions')
        .eq('id', guestId)
        .eq('wedding_id', weddingId)
        .single()

      if (guestError) throw guestError

      setWedding(weddingData)
      setGuest(guestData)
      setRsvpStatus(guestData.rsvp_status || 'pending')
      setPlusOneName(guestData.plus_one_name || '')
      setDietaryRestrictions(guestData.dietary_restrictions || '')
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load invitation details')
    } finally {
      setLoading(false)
    }
  }

  const handleRsvp = async (status: string) => {
    if (!guest) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('wedding_guests')
        .update({
          rsvp_status: status,
          plus_one_name: plusOneName || null,
          dietary_restrictions: dietaryRestrictions || null
        })
        .eq('id', guest.id)

      if (error) throw error

      setRsvpStatus(status)
      alert('RSVP updated successfully!')
    } catch (err) {
      console.error('Error updating RSVP:', err)
      alert('Failed to update RSVP. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const goToGallery = () => {
    router.push(`/weddings/${weddingId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error || !wedding || !guest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error || 'This invitation link is not valid or has expired.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">You're Invited!</h1>
          <h2 className="text-2xl text-pink-600 font-semibold">{wedding.name}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Wedding Details */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Wedding Details</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-pink-500 mr-3">📅</span>
                <span className="font-medium">{new Date(wedding.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <span className="text-pink-500 mr-3">📍</span>
                <span className="font-medium">{wedding.location}</span>
              </div>
              {wedding.description && (
                <div className="mt-4">
                  <p className="text-gray-600">{wedding.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* RSVP Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">RSVP</h3>
            <p className="text-gray-600 mb-4">Hi {guest.guest_name}! Please let us know if you'll be attending.</p>

            <div className="space-y-4">
              {/* RSVP Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleRsvp('attending')}
                  disabled={submitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    rsvpStatus === 'attending'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                  } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ✅ Attending
                </button>
                <button
                  onClick={() => handleRsvp('not_attending')}
                  disabled={submitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    rsvpStatus === 'not_attending'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                  } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ❌ Not Attending
                </button>
              </div>

              {/* Plus One */}
              {guest.plus_one && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plus One Name
                  </label>
                  <input
                    type="text"
                    value={plusOneName}
                    onChange={(e) => setPlusOneName(e.target.value)}
                    placeholder="Enter plus one name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Dietary Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Restrictions
                </label>
                <textarea
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  placeholder="Any dietary restrictions or allergies?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-8 space-x-4">
          <button
            onClick={goToGallery}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
          >
            📸 View Wedding Gallery
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-200"
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  )
}