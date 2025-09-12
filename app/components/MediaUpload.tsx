'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, Video, File, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface MediaUploadProps {
  weddingId: string
  onUploadSuccess?: (media: any) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

interface UploadingFile {
  file: File
  preview: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export default function MediaUpload({
  weddingId,
  onUploadSuccess,
  onUploadError,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*']
}: MediaUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // Debug: Check authentication status
    console.log('🔍 MediaUpload Debug:')
    console.log('- Number of files:', acceptedFiles.length)
    console.log('- Wedding ID:', weddingId)
    
    // Check if we have a session token
    const sessionToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('session-token='))
      ?.split('=')[1]
    
    console.log('- Session token exists:', !!sessionToken)
    if (sessionToken) {
      console.log('- Session token length:', sessionToken.length)
      console.log('- Session token value:', sessionToken)
    }

    // Also check all cookies
    console.log('- All cookies:', document.cookie)

    const newFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading'
    }))

    setUploadingFiles(prev => [...prev, ...newFiles])
    setIsUploading(true)

    // Upload files one by one
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      const fileIndex = uploadingFiles.length + i

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('weddingId', weddingId)
        formData.append('description', file.name)

        console.log('📤 Uploading file:', file.name)
        console.log('- File size:', file.size)
        console.log('- File type:', file.type)

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
          // Ensure credentials are sent
          credentials: 'include'
        })

        console.log('📥 Response status:', response.status)
        console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

        const result = await response.json()
        console.log('📥 Response body:', result)

        if (result.success) {
          setUploadingFiles(prev => prev.map((f, idx) => 
            idx === fileIndex 
              ? { ...f, progress: 100, status: 'success' as const }
              : f
          ))
          
          onUploadSuccess?.(result.media)
          toast.success(`Uploaded ${file.name}`)
        } else {
          console.error('❌ Upload failed:', result)
          throw new Error(result.message || 'Upload failed')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        console.error('❌ Upload error:', error)
        
        setUploadingFiles(prev => prev.map((f, idx) => 
          idx === fileIndex 
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f
        ))
        
        onUploadError?.(errorMessage)
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`)
      }
    }

    setIsUploading(false)
  }, [weddingId, uploadingFiles.length, onUploadSuccess, onUploadError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    disabled: isUploading
  })

  const removeFile = (index: number) => {
    setUploadingFiles(prev => {
      const newFiles = prev.filter((_, idx) => idx !== index)
      return newFiles
    })
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image
    if (file.type.startsWith('video/')) return Video
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {isDragActive ? (
          <p className="text-lg font-medium text-blue-600">
            Drop the files here...
          </p>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Upload Photos & Videos
            </p>
            <p className="text-sm text-gray-500">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports: JPG, PNG, GIF, MP4, MOV (Max {maxFiles} files)
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Uploading Files ({uploadingFiles.filter(f => f.status === 'uploading').length} remaining)
          </h3>
          
          <div className="space-y-2">
            {uploadingFiles.map((file, index) => {
              const FileIcon = getFileIcon(file.file)
              
              return (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    <FileIcon className="h-8 w-8 text-gray-400" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {file.status === 'uploading' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-xs text-blue-600">
                          {file.progress}%
                        </span>
                      </div>
                    )}
                    
                    {file.status === 'success' && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">Uploaded</span>
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">Failed</span>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
