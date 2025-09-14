'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { getWeddingUrl } from '@/app/lib/subdomain-utils'
import { 
  ArrowLeft,
  Save,
  Calendar,
  MapPin,
  Users,
  Camera,
  Settings,
  Heart,
  Trash2,
  Globe,
  Copy,
  Check,
  ExternalLink
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

export default function WeddingManagePage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const weddingId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: ''
  })

  useEffect(() => {
    if (weddingId) {
      fetchWedding()
    }
  }, [weddingId])

  const fetchWedding = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/weddings/${weddingId}`)
      const result = await response.json()

      if (result.success) {
        setWedding(result.wedding)
        setFormData({
          name: result.wedding.name,
          date: result.wedding.date,
          location: result.wedding.location,
          description: result.wedding.description || ''
        })
      } else {
        toast.error('Failed to load wedding details')
        router.push('/weddings/manage')
      }
    } catch (error) {
      console.error('Error fetching wedding:', error)
      toast.error('Failed to load wedding details')
      router.push('/weddings/manage')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch(`/api/weddings/${weddingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Wedding updated successfully!')
        setWedding(result.wedding)
      } else {
        toast.error(result.message || 'Failed to update wedding')
      }
    } catch (error) {
      console.error('Error updating wedding:', error)
      toast.error('Failed to update wedding')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this wedding? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/weddings/${weddingId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Wedding deleted successfully!')
        router.push('/weddings/manage')
      } else {
        toast.error(result.message || 'Failed to delete wedding')
      }
    } catch (error) {
      console.error('Error deleting wedding:', error)
      toast.error('Failed to delete wedding')
    } finally {
      setIsDeleting(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Wedding Not Found</h2>
          <p className="text-gray-600 mb-4">The wedding you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/weddings/manage')}
            className="inline-flex items-center space-x-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Weddings</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/weddings/manage')}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Weddings</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/weddings/${wedding.id}`)}
                className="inline-flex items-center space-x-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
              >
                <Camera className="w-4 h-4" />
                <span>View Gallery</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Wedding</h1>
                <p className="text-gray-600 mt-1">Edit wedding details and settings</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push(`/weddings/${weddingId}/subdomain`)}
                  className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Manage Subdomain</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Wedding'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Wedding URL Section - Only for Super Admins */}
          {user?.role === 'super_admin' && (
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Wedding URL</h2>
              </div>
              
              {wedding?.subdomain ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Your wedding is accessible at:</p>
                      <p className="font-mono text-lg text-gray-900 break-all">
                        {getWeddingUrl(wedding.subdomain)}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(getWeddingUrl(wedding.subdomain))}
                      className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy URL"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <a
                      href={getWeddingUrl(wedding.subdomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Visit wedding site</span>
                    </a>
                    <span className="text-sm text-gray-500">
                      Share this URL with your guests
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-4">🌐</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Subdomain Set</h3>
                  <p className="text-gray-600 mb-4">Your wedding doesn't have a custom subdomain yet.</p>
                  <button
                    onClick={() => router.push(`/weddings/${weddingId}/subdomain`)}
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Set Up Subdomain</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="px-8 py-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wedding Name
                </label>
                                 <input
                   type="text"
                   value={formData.name}
                   onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                   value={formData.date}
                   onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
                   value={formData.location}
                   onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
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
                   value={formData.description}
                   onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                   rows={4}
                   className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                   placeholder="Brief description of the wedding..."
                 />
              </div>

              {/* Wedding Stats */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Wedding Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Guests</p>
                      <p className="text-lg font-semibold text-gray-900">{wedding.guestCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Camera className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Photos</p>
                      <p className="text-lg font-semibold text-gray-900">{wedding.photoCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(wedding.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                type="button"
                onClick={() => router.push('/weddings/manage')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
