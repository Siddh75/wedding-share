'use client'

import { useState, useEffect } from 'react'
import { Image, Video, Heart, Download, Share2, MoreVertical, Eye, EyeOff, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface MediaItem {
  id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  status: string
  uploaded_by: string
  created_at: string
  description?: string
  metadata?: any
}

interface MediaGalleryProps {
  weddingId: string
  showPending?: boolean
  onMediaUpdate?: (mediaId: string, updates: any) => void
  onMediaDelete?: (mediaId: string) => void
  userRole?: string
}

export default function MediaGallery({
  weddingId,
  showPending = false,
  onMediaUpdate,
  onMediaDelete,
  userRole = 'guest'
}: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')

  useEffect(() => {
    fetchMedia()
  }, [weddingId, filter])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        weddingId,
        ...(filter !== 'all' && { status: filter === 'approved' ? 'approved' : 'pending' })
      })

      const response = await fetch(`/api/media/upload?${params}`)
      const result = await response.json()

      if (result.success) {
        setMedia(result.media)
      } else {
        toast.error('Failed to load media')
      }
    } catch (error) {
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (mediaId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const isApproved = newStatus === 'approved'
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: isApproved })
      })

      const result = await response.json()

      if (result.success) {
        setMedia(prev => prev.map(item => 
          item.id === mediaId 
            ? { ...item, status: isApproved ? 'approved' : 'pending' }
            : item
        ))
        onMediaUpdate?.(mediaId, { is_approved: isApproved })
        toast.success(`Media ${newStatus}`)
      } else {
        toast.error(result.message || 'Failed to update media')
      }
    } catch (error) {
      toast.error('Failed to update media')
    }
  }

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setMedia(prev => prev.filter(item => item.id !== mediaId))
        onMediaDelete?.(mediaId)
        toast.success('Media deleted')
      } else {
        toast.error(result.message || 'Failed to delete media')
      }
    } catch (error) {
      toast.error('Failed to delete media')
    }
  }

  const canModifyMedia = (item: MediaItem) => {
    return userRole === 'super_admin' || userRole === 'admin'
  }

  const canViewPending = () => {
    return userRole === 'super_admin' || userRole === 'admin'
  }

  const getStatusColor = (isApproved: boolean) => {
    return isApproved ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
  }

  const getStatusIcon = (isApproved: boolean) => {
    return isApproved ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
        <p className="text-gray-500">Upload some photos or videos to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-pink-100 text-pink-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({media.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'approved' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved ({media.filter(m => m.status === 'approved').length})
          </button>
          {canViewPending() && (
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'pending' 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({media.filter(m => m.status !== 'approved').length})
            </button>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {media.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Media Preview */}
            <div className="aspect-square relative overflow-hidden">
              {item.file_type?.startsWith('image/') ? (
                <img
                  src={item.file_url}
                  alt={item.file_name || 'Media'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : item.file_type?.startsWith('video/') ? (
                <video
                  src={item.file_url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  controls
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>
              )}

              {/* Status Badge */}
              <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(item.status === 'approved')}`}>
                {getStatusIcon(item.status === 'approved')}
                <span className="capitalize">{item.status}</span>
              </div>

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                  <button
                    onClick={() => setSelectedMedia(item)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => window.open(item.file_url, '_blank')}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4 text-gray-700" />
                  </button>
                  {canModifyMedia(item) && (
                    <div className="relative">
                      <button className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-700" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Media Info */}
            <div className="p-3">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.file_name || 'Untitled'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                by {item.uploaded_by} • {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Admin Actions */}
            {canModifyMedia(item) && item.status !== 'approved' && (
              <div className="px-3 pb-3 flex space-x-2">
                <button
                  onClick={() => handleStatusUpdate(item.id, 'approved')}
                  className="flex-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(item.id, 'rejected')}
                  className="flex-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedMedia.filename || 'Media Preview'}
              </h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              {selectedMedia.mime_type?.startsWith('image/') ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.filename || 'Media'}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : selectedMedia.mime_type?.startsWith('video/') ? (
                <video
                  src={selectedMedia.url}
                  controls
                  className="max-w-full max-h-[70vh]"
                />
              ) : (
                <div className="max-w-full max-h-[70vh] flex items-center justify-center bg-gray-100">
                  <span className="text-gray-500">Preview not available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




