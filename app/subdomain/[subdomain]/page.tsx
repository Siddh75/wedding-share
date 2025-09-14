'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import MediaUpload from '../../components/MediaUpload'
import MediaGallery from '../../components/MediaGallery'
import GuestManagement from '../../components/GuestManagement'
import { Upload, Image, Users, Calendar, MapPin, Camera, X, Settings } from 'lucide-react'

interface WeddingGalleryProps {
  params: { subdomain: string }
  searchParams: { tab?: string }
}

interface Wedding {
  id: string
  name: string
  date: string
  location: string
  description?: string
  subdomain: string
}

export default function SubdomainWeddingGallery({ params, searchParams }: WeddingGalleryProps) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'guests'>(
    (searchParams.tab as 'gallery' | 'upload' | 'guests') || 'gallery'
  )
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [isLoadingWedding, setIsLoadingWedding] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeddingBySubdomain = async () => {
      try {
        const response = await fetch(`/api/weddings/subdomain/${params.subdomain}`)
        const result = await response.json()
        
        if (result.success) {
          setWedding(result.wedding)
        } else {
          setError(result.message || 'Wedding not found')
        }
      } catch (error) {
        console.error('Error fetching wedding:', error)
        setError('Failed to load wedding')
      } finally {
        setIsLoadingWedding(false)
      }
    }

    if (params.subdomain) {
      fetchWeddingBySubdomain()
    }
  }, [params.subdomain])

  if (isLoadingWedding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wedding gallery...</p>
        </div>
      </div>
    )
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wedding Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || 'The wedding you\'re looking for doesn\'t exist or is no longer available.'}
          </p>
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{wedding.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(wedding.date).toLocaleDateString()}
                </div>
                {wedding.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {wedding.location}
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {wedding.subdomain}.weddingshare.com
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gallery'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Image className="h-5 w-5 inline mr-2" />
              Gallery
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-5 w-5 inline mr-2" />
              Upload
            </button>
            <button
              onClick={() => setActiveTab('guests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'guests'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-5 w-5 inline mr-2" />
              Guests
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'gallery' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Photo Gallery</h2>
            <MediaGallery weddingId={wedding.id} />
          </div>
        )}

        {activeTab === 'upload' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Photos</h2>
            <MediaUpload weddingId={wedding.id} />
          </div>
        )}

        {activeTab === 'guests' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Guest Management</h2>
            <GuestManagement weddingId={wedding.id} />
          </div>
        )}
      </div>
    </div>
  )
}
