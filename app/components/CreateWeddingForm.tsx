'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, MapPin, Camera, Heart, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { cn } from '@/app/lib/utils'

const createWeddingSchema = z.object({
  name: z.string().min(3, 'Wedding name must be at least 3 characters').max(100, 'Wedding name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  date: z.string().min(1, 'Wedding date is required'),
  location: z.string().min(1, 'Location is required').max(200, 'Location must be less than 200 characters'),
  coverImage: z.string().optional(),
  adminEmail: z.string().email('Please provide a valid email address'),
})

type CreateWeddingFormData = z.infer<typeof createWeddingSchema>

export default function CreateWeddingForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<CreateWeddingFormData>({
    resolver: zodResolver(createWeddingSchema),
    mode: 'onChange',
  })

  const watchedName = watch('name')

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    try {
      setIsLoading(true)
      
      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCoverImagePreview(result)
        setValue('coverImage', result)
      }
      reader.readAsDataURL(file)

      toast.success('Cover image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: CreateWeddingFormData) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/weddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create wedding')
      }

      const result = await response.json()
      toast.success('Wedding created successfully!')
      router.push(`/weddings/${result.data.id}`)
    } catch (error) {
      console.error('Error creating wedding:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create wedding')
    } finally {
      setIsLoading(false)
    }
  }

  const generateWeddingName = () => {
    const names = [
      'Sarah & Michael\'s Wedding',
      'Emma & James\'s Celebration',
      'Olivia & William\'s Big Day',
      'Ava & Benjamin\'s Wedding',
      'Isabella & Lucas\'s Celebration'
    ]
    const randomName = names[Math.floor(Math.random() * names.length)]
    setValue('name', randomName)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600 rounded-2xl mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Wedding
          </h1>
          <p className="text-gray-600">
            Set up your digital wedding album and start sharing memories with loved ones
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Wedding Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Wedding Name *
            </label>
            <div className="relative">
              <input
                {...register('name')}
                type="text"
                id="name"
                placeholder="e.g., Sarah & Michael's Wedding"
                className={cn(
                  "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors",
                  errors.name ? "border-red-300" : "border-gray-300"
                )}
              />
              <button
                type="button"
                onClick={generateWeddingName}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-pink-600 transition-colors"
                title="Generate random name"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
            {watchedName && (
              <p className="mt-1 text-sm text-gray-500">
                Your wedding will be accessible at: <span className="font-mono text-pink-600">weddingshare.com/{watchedName.toLowerCase().replace(/[^a-z0-9]/g, '-')}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              placeholder="Tell your guests about your special day..."
              className={cn(
                "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors resize-none",
                errors.description ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Date and Location Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wedding Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Wedding Date *
              </label>
              <div className="relative">
                <input
                  {...register('date')}
                  type="date"
                  id="date"
                  className={cn(
                    "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors",
                    errors.date ? "border-red-300" : "border-gray-300"
                  )}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <input
                  {...register('location')}
                  type="text"
                  id="location"
                  placeholder="e.g., St. Mary's Church, New York"
                  className={cn(
                    "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors",
                    errors.location ? "border-red-300" : "border-gray-300"
                  )}
                />
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
          </div>

          {/* Wedding Admin Email */}
          <div>
            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Wedding Admin Email *
            </label>
            <input
              {...register('adminEmail')}
              type="email"
              id="adminEmail"
              placeholder="admin@example.com"
              className={cn(
                "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors",
                errors.adminEmail ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.adminEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.adminEmail.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              An invitation will be sent to this email for wedding management access
            </p>
          </div>

          {/* Cover Image */}
          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
            <div className="space-y-4">
              <input
                type="file"
                id="coverImage"
                accept="image/*"
                onChange={handleCoverImageUpload}
                className="hidden"
              />
              <label
                htmlFor="coverImage"
                className={cn(
                  "block w-full p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors hover:border-pink-400 hover:bg-pink-50",
                  coverImagePreview ? "border-pink-300 bg-pink-50" : "border-gray-300 hover:border-pink-400"
                )}
              >
                {coverImagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                    />
                    <p className="text-sm text-pink-600 font-medium">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-gray-600">
                      <span className="font-medium text-pink-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={cn(
              "w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2",
              isValid && !isLoading
                ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Wedding...</span>
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                <span>Create Wedding</span>
              </>
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your wedding gallery will be created with a unique access code</li>
            <li>• You'll be automatically added as an admin</li>
            <li>• Start inviting guests and uploading photos</li>
            <li>• Customize your gallery settings and permissions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}






