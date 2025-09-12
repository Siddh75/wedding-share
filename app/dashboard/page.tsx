'use client'

import { useAuth } from '@/app/components/AuthProvider'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Plus, Users, Image as ImageIcon, Calendar, MapPin, Camera, Video, X } from 'lucide-react'
import Link from 'next/link'

interface Wedding {
  id: string
  name: string
  date: string
  location: string
  photoCount: number
  guestCount: number
  status: 'active' | 'draft' | 'archived'
  admin_ids?: string[]
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [isLoadingWeddings, setIsLoadingWeddings] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedMedia, setCapturedMedia] = useState<{ type: 'photo' | 'video', data: string } | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'admin') {
        // For wedding admins, fetch their wedding and redirect
        setIsLoadingWeddings(true)
        fetchWeddingsForAdmin()
      } else if (user.role === 'super_admin') {
        // For super admins, show the dashboard
        fetchWeddings()
      }
    }
  }, [user, loading])

  const fetchWeddingsForAdmin = async () => {
    try {
      console.log('🔍 Fetching weddings for admin:', user?.id)
      const response = await fetch('/api/weddings', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Received wedding data:', data)
        
        if (data.weddings && data.weddings.length > 0) {
          console.log('✅ Found weddings, redirecting to first one:', data.weddings[0])
          // For admin users, redirect to their wedding page
          window.location.href = `/weddings/${data.weddings[0].id}`
        } else {
          console.log('❌ No weddings found for admin - redirecting to create wedding')
          // If no weddings found, redirect to create wedding page
          window.location.href = '/weddings/create'
        }
      } else {
        console.error('❌ Failed to fetch weddings:', response.status)
        const errorData = await response.json()
        console.error('Error details:', errorData)
        setWeddings([])
      }
    } catch (error) {
      console.error('❌ Error fetching admin wedding:', error)
      setWeddings([])
    } finally {
      setIsLoadingWeddings(false)
    }
  }

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    setCapturedMedia(null)
    setIsRecording(false)
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setCapturedMedia({ type: 'photo', data: dataUrl })
      }
    }
  }

  const startRecording = () => {
    if (videoRef.current && streamRef.current) {
      const mediaRecorder = new MediaRecorder(streamRef.current)
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const dataUrl = URL.createObjectURL(blob)
        setCapturedMedia({ type: 'video', data: dataUrl })
        setIsRecording(false)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
      // Stop recording after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 30000)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
  }

  const saveMedia = async () => {
    if (capturedMedia && weddings.length > 0) {
      try {
        // Convert data URL to blob
        const response = await fetch(capturedMedia.data)
        const blob = await response.blob()
        
        // Create FormData for upload
        const formData = new FormData()
        formData.append('file', blob, `captured_${Date.now()}.${capturedMedia.type === 'photo' ? 'jpg' : 'webm'}`)
        formData.append('weddingId', weddings[0].id)
        formData.append('type', capturedMedia.type)
        
        // Upload to server
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          alert(`${capturedMedia.type === 'photo' ? 'Photo' : 'Video'} uploaded successfully!`)
          setCapturedMedia(null)
          // Refresh wedding data to update photo count
          fetchWeddings()
        } else {
          throw new Error('Upload failed')
        }
      } catch (error) {
        console.error('Error saving media:', error)
        alert('Failed to save media. Please try again.')
      }
    }
  }

  const fetchWeddings = async () => {
    setIsLoadingWeddings(true)
    try {
      const response = await fetch('/api/weddings')
      if (response.ok) {
        const data = await response.json()
        setWeddings(data.weddings || [])
      }
    } catch (error) {
      console.error('Failed to fetch weddings:', error)
    } finally {
      setIsLoadingWeddings(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is admin and we're still loading weddings, show loading
  if (user?.role === 'admin' && isLoadingWeddings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wedding...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.role === 'admin' ? 'My Wedding' : 'Dashboard'}
              </h1>
              <p className="text-gray-600 mt-2">Welcome back, {user.name}!</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              {user.role === 'admin' && weddings.length > 0 && (
                <>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Take Photo/Video</span>
                  </button>
                  <Link
                    href={`/weddings/${weddings[0].id}?tab=upload`}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>Quick Upload</span>
                  </Link>
                </>
              )}
              {user.role === 'super_admin' && (
                <Link
                  href="/weddings/create"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Wedding</span>
                </Link>
              )}
            </div>
          </div>

          {/* Camera Modal */}
          {showCamera && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Camera</h3>
                  <button
                    onClick={stopCamera}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg bg-gray-900"
                  />
                  
                  {capturedMedia && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Captured {capturedMedia.type === 'photo' ? 'Photo' : 'Video'}
                      </h4>
                      {capturedMedia.type === 'photo' ? (
                        <img 
                          src={capturedMedia.data} 
                          alt="Captured photo" 
                          className="w-full rounded-lg max-h-64 object-cover"
                        />
                      ) : (
                        <video 
                          src={capturedMedia.data} 
                          controls 
                          className="w-full rounded-lg max-h-64"
                        />
                      )}
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={saveMedia}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Save to Wedding
                        </button>
                        <button
                          onClick={() => setCapturedMedia(null)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Retake
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!capturedMedia && (
                    <div className="mt-4 flex justify-center space-x-4">
                      <button
                        onClick={capturePhoto}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Camera className="w-5 h-5" />
                        <span>Take Photo</span>
                      </button>
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                          isRecording 
                            ? 'bg-red-600 text-white hover:bg-red-700' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        <Video className="w-5 h-5" />
                        <span>{isRecording ? 'Stop Recording' : 'Record Video'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Role-based Content */}
          {(user.role === 'super_admin' || user.role === 'admin') ? (
            // Super Admin & Wedding Admin Dashboard
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {user.role === 'super_admin' ? (
                  // Super Admin Stats
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-pink-100 rounded-lg">
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
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <ImageIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Photos</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {weddings.reduce((sum, wedding) => sum + (wedding.photoCount || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Guests</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {weddings.reduce((sum, wedding) => sum + (wedding.guestCount || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Active Weddings</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {weddings.filter(w => w.status === 'active').length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Wedding Admin Stats
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Heart className="w-6 h-6 text-pink-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Wedding Status</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {weddings[0]?.status || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <ImageIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Photos</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {weddings[0]?.photoCount || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Guests</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {weddings[0]?.guestCount || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Wedding Date</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {weddings[0]?.date ? new Date(weddings[0].date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Upload Section for Wedding Admin */}
              {user.role === 'admin' && weddings.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Quick Upload</h3>
                      <p className="text-sm text-gray-600 mt-1">Add new photos to your wedding gallery</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={startCamera}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Camera</span>
                      </button>
                      <Link
                        href={`/weddings/${weddings[0].id}?tab=upload`}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Upload Photos</span>
                      </Link>
                    </div>
                  </div>
                  {/* Quick Upload Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{weddings[0]?.photoCount || 0}</div>
                      <div className="text-sm text-gray-600">Total Photos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{weddings[0]?.guestCount || 0}</div>
                      <div className="text-sm text-gray-600">Total Guests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{weddings[0]?.status || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Status</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Weddings List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.role === 'super_admin' ? 'Your Weddings' : 'My Wedding'}
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {isLoadingWeddings ? (
                    <div className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading weddings...</p>
                    </div>
                  ) : weddings.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {user.role === 'super_admin' ? 'No weddings yet' : 'No wedding assigned'}
                      </h3>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {user.role === 'super_admin' 
                          ? 'Create your first wedding to get started.'
                          : 'You haven\'t been assigned to any weddings yet.'
                        }
                      </p>
                      {user.role === 'super_admin' && (
                        <Link
                          href="/weddings/create"
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Wedding</span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    weddings.map((wedding) => (
                      <div key={wedding.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-medium text-gray-900">{wedding.name}</h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(wedding.status)}`}>
                                {wedding.status}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{wedding.date}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{wedding.location}</span>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                              <span>{wedding.photoCount || 0} photos</span>
                              <span>{wedding.guestCount || 0} guests</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {user.role === 'admin' && (
                              <Link
                                href={`/weddings/${wedding.id}?tab=upload`}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                title="Quick Upload"
                              >
                                <Plus className="w-5 h-5" />
                              </Link>
                            )}
                            <Link
                              href={`/weddings/${wedding.id}`}
                              className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
                              title="View Gallery"
                            >
                              <ImageIcon className="w-5 h-5" />
                            </Link>
                            <Link
                              href={`/weddings/${wedding.id}?tab=guests`}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Manage Guests"
                            >
                              <Users className="w-5 h-5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Regular User Dashboard (Guests)
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to WeddingShare!</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  You're currently logged in as a {user.role.replace('_', ' ')}. 
                  {user.role === 'guest' 
                    ? ' Use a wedding code to join a wedding gallery and start sharing memories.'
                    : ' You can view and manage weddings you have access to.'
                  }
                </p>
                {user.role === 'guest' && (
                  <Link
                    href="/join"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium"
                  >
                    <span>Join a Wedding</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
