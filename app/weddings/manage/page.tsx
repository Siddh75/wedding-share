'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Camera, 
  Settings,
  Heart,
  ArrowRight
} from 'lucide-react'

interface Wedding {
  id: string
  name: string
  date: string
  location: string
  description: string
  code: string
  subdomain: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  guestCount: number
  photoCount: number
  createdAt: string
}

export default function WeddingManagement() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateWedding = async (formData: FormData) => {
    setIsCreating(true)
    try {
      const weddingData = {
        name: formData.get('name') as string,
        date: formData.get('date') as string,
        location: formData.get('location') as string,
        description: formData.get('description') as string,
        adminEmail: formData.get('adminEmail') as string,
      }

      const response = await fetch('/api/weddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weddingData),
      })

      const result = await response.json()

      if (result.success) {
        fetchWeddings()
        setShowCreateForm(false)
        toast.success('Wedding created successfully! Invitation email sent to wedding admin.')
      } else {
        toast.error(result.message || 'Failed to create wedding')
      }
    } catch (error) {
      console.error('Error creating wedding:', error)
      toast.error('Failed to create wedding')
    } finally {
      setIsCreating(false)
    }
  }

  const fetchWeddings = async () => {
    try {
      console.log('🔍 Fetching weddings...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/weddings', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('🔍 Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('🔍 API result:', result)

      if (result.success) {
        const transformedWeddings = result.weddings.map((wedding: any) => ({
          id: wedding.id,
          name: wedding.name,
          date: wedding.date,
          location: wedding.location,
          description: wedding.description,
          code: wedding.code,
          subdomain: wedding.subdomain,
          status: wedding.status,
          guestCount: wedding.wedding_invitations?.[0]?.count || 0,
          photoCount: wedding.media?.[0]?.count || 0,
          createdAt: new Date(wedding.created_at).toISOString().split('T')[0]
        }))
        console.log('🔍 Transformed weddings:', transformedWeddings)
        setWeddings(transformedWeddings)
      } else {
        console.error('❌ Failed to fetch weddings:', result.message)
        toast.error('Failed to load weddings')
      }
    } catch (error) {
      console.error('❌ Error fetching weddings:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.')
      } else {
        toast.error('Failed to load weddings')
      }
    } finally {
      console.log('🔍 Setting loading to false')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔍 Manage Weddings: User state changed', { user, loading })
    if (user && !loading) {
      if (user.role === 'super_admin') {
        console.log('✅ Super admin detected, fetching weddings')
        fetchWeddings()
      } else {
        console.log('❌ Not super admin, redirecting to dashboard')
        router.push('/dashboard')
      }
    } else if (!loading && !user) {
      console.log('❌ No user found, redirecting to signin')
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          <p className="mt-2 text-sm text-gray-500">Debug: Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Check if user is not logged in or not a super admin
  if (!user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only Super Admins can manage weddings.</p>
          <p className="mt-2 text-sm text-gray-500">Debug: User: {user ? `${user.name} (${user.role})` : 'Not logged in'}</p>
          <a href="/auth/signin" className="mt-4 inline-block bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weddings...</p>
        </div>
      </div>
    )
  }

  // Show empty state if no weddings
  if (weddings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Wedding Management</h1>
                <p className="text-gray-600 mt-2">Create and manage weddings for your clients</p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium mt-4 sm:mt-0"
              >
                <Plus className="w-5 h-5" />
                <span>Create Wedding</span>
              </button>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No weddings yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first wedding</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Wedding</span>
              </button>
            </div>
          </div>
        </div>

        {/* Create Wedding Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Wedding</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateWedding(new FormData(e.currentTarget)) }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wedding Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                      placeholder="e.g., Sarah & John Wedding"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wedding Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      required
                      className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                      placeholder="e.g., Central Park Gardens"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                      placeholder="Brief description of the wedding..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wedding Admin Email
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      required
                      className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                      placeholder="admin@example.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      An invitation will be sent to this email for wedding management access
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Wedding'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Main content with weddings list
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wedding Management</h1>
              <p className="text-gray-600 mt-2">Create and manage weddings for your clients</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium mt-4 sm:mt-0"
            >
              <Plus className="w-5 h-5" />
              <span>Create Wedding</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-pink-100">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Weddings</p>
                  <p className="text-2xl font-bold text-gray-900">{weddings.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {weddings.filter(w => w.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Guests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {weddings.reduce((sum, w) => sum + w.guestCount, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Camera className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Photos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {weddings.reduce((sum, w) => sum + w.photoCount, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weddings List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Weddings</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {weddings.map((wedding) => (
                <div key={wedding.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-semibold text-gray-900">{wedding.name}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(wedding.status)}`}>
                          {wedding.status}
                        </span>
                      </div>
                      <div className="mt-2 text-gray-600">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="inline-flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(wedding.date).toLocaleDateString()}</span>
                          </span>
                          <span className="inline-flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{wedding.location}</span>
                          </span>
                          <span className="inline-flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>{wedding.guestCount} guests</span>
                          </span>
                          <span className="inline-flex items-center space-x-2">
                            <Camera className="w-4 h-4" />
                            <span>{wedding.photoCount} photos</span>
                          </span>
                        </div>
                        <p className="mt-2 text-sm">{wedding.description}</p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>Code: {wedding.code}</span>
                          {wedding.subdomain && (
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {wedding.subdomain}.weddingshare.com
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => router.push(`/weddings/${wedding.id}/manage`)}
                        className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Manage</span>
                      </button>
                      {wedding.subdomain && (
                        <a
                          href={`https://${wedding.subdomain}.weddingshare.com`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <span>Visit Subdomain</span>
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => router.push(`/weddings/${wedding.id}`)}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700"
                      >
                        <span>View Gallery</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Wedding Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Wedding</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateWedding(new FormData(e.currentTarget)) }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wedding Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="e.g., Sarah & John Wedding"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wedding Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="e.g., Central Park Gardens"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="Brief description of the wedding..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wedding Admin Email
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    required
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="admin@example.com"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    An invitation will be sent to this email for wedding management access
                  </p>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Wedding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
