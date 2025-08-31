'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Camera, Upload, Users, Calendar, Image as ImageIcon, LogIn, LogOut, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HomePage() {
  const { data: session, status } = useSession()
  const [weddingCode, setWeddingCode] = useState('')
  const [guestName, setGuestName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGuestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName || !weddingCode) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      // This would call your API route for guest access
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName, wedding_code: weddingCode })
      })

      if (response.ok) {
        toast.success('Welcome to the wedding!')
        // Handle successful guest access
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to join wedding')
      }
    } catch (error) {
      toast.error('Failed to join wedding')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600">
      {/* Header */}
      <header className="text-center text-white py-16">
        <h1 className="text-6xl font-bold mb-4">Wedding Share</h1>
        <p className="text-xl opacity-90">Share your special moments with family and friends</p>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {!session ? (
          // Guest Access Section
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Join as Guest</h2>
              <p className="text-gray-600 mb-6">Access the wedding gallery and share your photos</p>
              
              <form onSubmit={handleGuestAccess} className="space-y-4">
                <div>
                  <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="weddingCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Wedding Code
                  </label>
                  <input
                    type="text"
                    id="weddingCode"
                    value={weddingCode}
                    onChange={(e) => setWeddingCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter wedding code"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Joining...' : 'Join Wedding'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => signIn('google')}
                  className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                  Continue with Google
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Admin Access</h2>
              <p className="text-gray-600 mb-6">Manage the wedding gallery and approve media</p>
              
              <button
                onClick={() => signIn()}
                className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Admin Login
              </button>
            </div>
          </div>
        ) : (
          // Authenticated User Dashboard
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Welcome back!</h2>
                <p className="text-gray-600">Manage your wedding gallery</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">{session.user?.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                <Upload className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Upload Media</h3>
                <p className="opacity-90">Share photos and videos</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                <ImageIcon className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-semibold mb-2">View Gallery</h3>
                <p className="opacity-90">Browse all shared memories</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                <Calendar className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Events</h3>
                <p className="opacity-90">Manage wedding events</p>
              </div>
              
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-xl">
                <Users className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Guests</h3>
                <p className="opacity-90">Manage guest access</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
