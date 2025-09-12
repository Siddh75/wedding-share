'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../components/AuthProvider'
import MediaUpload from '../../components/MediaUpload'
import MediaGallery from '../../components/MediaGallery'
import GuestManagement from '../../components/GuestManagement'
import { Upload, Image, Users, Calendar, MapPin, Camera, X, Settings } from 'lucide-react'

interface WeddingGalleryProps {
  params: { id: string }
  searchParams: { tab?: string }
}

interface Wedding {
  id: string
  name: string
  date: string
  location: string
  description?: string
}

export default function WeddingGallery({ params, searchParams }: WeddingGalleryProps) {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'guests'>(
    (searchParams.tab as 'gallery' | 'upload' | 'guests') || 'gallery'
  )
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [isLoadingWedding, setIsLoadingWedding] = useState(true)
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false)
  const [capturedMedia, setCapturedMedia] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const fetchWedding = async () => {
      try {
        const response = await fetch(`/api/weddings/${params.id}`)
        const result = await response.json()
        
        if (result.success) {
          setWedding(result.wedding)
        } else {
          console.error('Failed to fetch wedding:', result.message)
        }
      } catch (error) {
        console.error('Error fetching wedding:', error)
      } finally {
        setIsLoadingWedding(false)
      }
    }

    if (params.id) {
      fetchWedding()
    }
  }, [params.id])

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && streamRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setCapturedMedia(file)
            stopCamera()
          }
        }, 'image/jpeg')
      }
    }
  }

  const startRecording = () => {
    if (videoRef.current && streamRef.current) {
      const mediaRecorder = new MediaRecorder(streamRef.current)
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' })
        setCapturedMedia(file)
        stopCamera()
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
      // Stop recording after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          setIsRecording(false)
        }
      }, 30000)
    }
  }

  const saveMedia = async () => {
    if (capturedMedia && wedding) {
      const formData = new FormData()
      formData.append('file', capturedMedia)
      formData.append('weddingId', wedding.id)
      formData.append('description', 'Captured from mobile camera')
      
      try {
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          alert('Media captured and uploaded successfully!')
          setCapturedMedia(null)
          setShowCamera(false)
          // Refresh media gallery
          window.location.reload()
        } else {
          alert('Failed to upload captured media')
        }
      } catch (error) {
        console.error('Error uploading captured media:', error)
        alert('Failed to upload captured media')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to view this wedding gallery.</p>
        </div>
      </div>
    )
  }

  const canUpload = user.role === 'super_admin' || user.role === 'admin' || user.role === 'guest'
  const canManageGuests = user.role === 'super_admin' || user.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isLoadingWedding ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-96"></div>
                </div>
              ) : wedding ? (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{wedding.name}</h1>
                  <div className="flex items-center space-x-6 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(wedding.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{wedding.location}</span>
                    </div>
                  </div>
                  {wedding.description && (
                    <p className="text-gray-600 mt-2">{wedding.description}</p>
                  )}
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Wedding Gallery</h1>
                  <p className="text-gray-600">Share and view memories from this special day</p>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Mobile Camera Button - Only show for admin users */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowCamera(true)
                    startCamera()
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo/Video
                </button>
              )}
              
              {/* Manage Button - Only show for super admin users */}
              {user?.role === 'super_admin' && (
                <a
                  href={`/weddings/${params.id}/manage`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Manage
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'gallery'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Image className="h-4 w-4" />
                  <span>Gallery</span>
                </div>
              </button>
              
              {canUpload && (
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'upload'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </div>
                </button>
              )}
              
              {canManageGuests && (
                <button
                  onClick={() => setActiveTab('guests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'guests'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Guests</span>
                  </div>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'gallery' && (
            <MediaGallery 
              weddingId={params.id} 
              userRole={user.role}
            />
          )}
          
          {activeTab === 'upload' && canUpload && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Media</h2>
                <p className="text-gray-600">
                  Share your photos and videos from the wedding. {user.role === 'guest' && 'Your uploads will be reviewed before being published.'}
                </p>
              </div>
              
                             <MediaUpload 
                 weddingId={params.id}
                 onUploadSuccess={(media: any) => {
                   console.log('Upload successful:', media)
                 }}
                 onUploadError={(error: string) => {
                   console.error('Upload failed:', error)
                 }}
               />
            </div>
          )}
          
          {activeTab === 'guests' && canManageGuests && (
            <div>
              <GuestManagement 
                weddingId={params.id}
                userRole={user.role}
              />
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Camera</h3>
                <button
                  onClick={() => {
                    setShowCamera(false)
                    setCapturedMedia(null)
                    stopCamera()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {!capturedMedia ? (
                <div className="space-y-4">
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={capturePhoto}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      📸 Take Photo
                    </button>
                    <button
                      onClick={startRecording}
                      disabled={isRecording}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        isRecording 
                          ? 'bg-red-600 text-white' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isRecording ? '⏹️ Recording...' : '🎥 Record Video'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      {capturedMedia.type.startsWith('image/') ? 'Photo captured!' : 'Video recorded!'}
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={saveMedia}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        💾 Save & Upload
                      </button>
                      <button
                        onClick={() => {
                          setCapturedMedia(null)
                          startCamera()
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        🔄 Retake
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
