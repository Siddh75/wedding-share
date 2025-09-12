import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export interface UploadResult {
  public_id: string
  secure_url: string
  format: string
  width: number
  height: number
  bytes: number
  resource_type: 'image' | 'video'
  created_at: string
}

export interface UploadOptions {
  folder?: string
  transformation?: any[]
  resource_type?: 'image' | 'video' | 'auto'
  allowed_formats?: string[]
  max_bytes?: number
}

export async function uploadMedia(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    folder = 'wedding-share',
    transformation = [],
    resource_type = 'auto',
    allowed_formats = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi'],
    max_bytes = 100 * 1024 * 1024 // 100MB
  } = options

  try {
    const result = await cloudinary.uploader.upload(file as string, {
      folder,
      resource_type,
      transformation,
      allowed_formats,
      max_bytes,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      invalidate: true
    })

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      width: result.width || 0,
      height: result.height || 0,
      bytes: result.bytes,
      resource_type: result.resource_type as 'image' | 'video',
      created_at: result.created_at
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload media')
  }
}

export async function deleteMedia(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete media')
  }
}

export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: string
    crop?: string
  } = {}
): string {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    crop = 'fill'
  } = options

  let transformation = ''

  if (width || height) {
    transformation += `w_${width || 'auto'},h_${height || 'auto'},c_${crop},`
  }

  transformation += `q_${quality},f_${format}`

  return cloudinary.url(publicId, {
    transformation: [{ width, height, crop, quality, format }]
  })
}

export function getThumbnailUrl(publicId: string, width = 300, height = 300): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill', quality: 70 },
      { fetch_format: 'auto' }
    ]
  })
}

export function getVideoThumbnailUrl(publicId: string, width = 300, height = 300): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill', quality: 70 },
      { fetch_format: 'auto' }
    ],
    resource_type: 'video',
    video_codec: 'auto'
  })
}

