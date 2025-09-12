'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/components/AuthProvider'
import { toast } from 'react-hot-toast'
import { Heart, Mail, Lock, User, Calendar, MapPin, Camera } from 'lucide-react'

export default function SignUp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  // Get invitation data from URL parameters
  const weddingId = searchParams.get('wedding')
  const weddingName = searchParams.get('name')
  const weddingDate = searchParams.get('date')
  const weddingLocation = searchParams.get('location')
  const invitationEmail = searchParams.get('email')

  // Check if this is a direct admin signup (no invitation)
  const isDirectAdminSignup = !weddingId && !invitationEmail

  const [formData, setFormData] = useState({
    name: '',
    email: invitationEmail || '',
    password: '',
    confirmPassword: ''
  })
  
  // Wedding creation form data for direct admin signup
  const [weddingData, setWeddingData] = useState({
    weddingName: '',
    weddingDescription: '',
    weddingDate: '',
    weddingLocation: '',
    coverImage: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [step, setStep] = useState<'wedding' | 'account'>('wedding')

  const handleWeddingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!weddingData.weddingName || !weddingData.weddingDate || !weddingData.weddingLocation || !formData.email) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      // Send wedding details and email for confirmation
      const response = await fetch('/api/auth/wedding-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          weddingData: {
            name: weddingData.weddingName,
            description: weddingData.weddingDescription,
            date: weddingData.weddingDate,
            location: weddingData.weddingLocation,
            coverImage: weddingData.coverImage
          }
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Please check your email to complete your account setup!')
        setStep('account')
      } else {
        toast.error(result.message || 'Failed to send confirmation email')
      }
    } catch (error) {
      console.error('Wedding signup error:', error)
      toast.error('An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)

    try {
      // For invitation signup, use existing flow
      const signupData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        weddingId: weddingId,
        role: weddingId ? 'admin' : 'guest'
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      })

      const result = await response.json()

      if (result.success) {
        if (weddingId) {
          // For invited users, log in automatically
          toast.success('Account created successfully!')
          const loginSuccess = await login(formData.email, formData.password)
          if (loginSuccess) {
            router.push(`/weddings/${weddingId}/manage`)
          }
        } else {
          // For direct signups, show confirmation message
          toast.success('Account created! Please check your email to confirm your account.')
          router.push('/auth/signin?message=Please check your email to confirm your account')
        }
      } else {
        toast.error(result.message || 'Failed to create account')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't allow changes to email if it's from an invitation
    if (e.target.name === 'email' && invitationEmail) {
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleWeddingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setWeddingData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

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
      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCoverImagePreview(result)
        setWeddingData(prev => ({
          ...prev,
          coverImage: result
        }))
      }
      reader.readAsDataURL(file)

      toast.success('Cover image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Heart className="h-12 w-12 text-pink-500" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isDirectAdminSignup ? 'Create Your Wedding Account' : 'Create Your Account'}
          </h2>
          {isDirectAdminSignup && (
            <p className="mt-2 text-sm text-gray-600">
              Create your account and set up your wedding in one step
            </p>
          )}
          {weddingName && (
            <div className="mt-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <p className="text-sm text-gray-600 mb-2">You're being invited to manage:</p>
              <div className="text-left space-y-1">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="font-medium text-gray-900">{weddingName}</span>
                </div>
                {weddingDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(weddingDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {weddingLocation && (
                  <p className="text-sm text-gray-600">{weddingLocation}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 1: Wedding Details Form (for direct admin signup) */}
        {isDirectAdminSignup && step === 'wedding' && (
          <form className="mt-8 space-y-6" onSubmit={handleWeddingSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="weddingName" className="block text-sm font-medium text-gray-700 mb-2">
                  Wedding Name *
                </label>
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="weddingName"
                    name="weddingName"
                    type="text"
                    required
                    value={weddingData.weddingName}
                    onChange={handleWeddingInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="e.g., Sarah & John's Wedding"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Wedding Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="weddingDate"
                    name="weddingDate"
                    type="date"
                    required
                    value={weddingData.weddingDate}
                    onChange={handleWeddingInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="weddingLocation" className="block text-sm font-medium text-gray-700 mb-2">
                  Wedding Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="weddingLocation"
                    name="weddingLocation"
                    type="text"
                    required
                    value={weddingData.weddingLocation}
                    onChange={handleWeddingInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="e.g., The Grand Ballroom, New York"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="weddingDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Wedding Description
                </label>
                <textarea
                  id="weddingDescription"
                  name="weddingDescription"
                  rows={3}
                  value={weddingData.weddingDescription}
                  onChange={handleWeddingInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                  placeholder="Tell your guests about your special day..."
                />
              </div>

              <div>
                <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image
                </label>
                <div className="space-y-2">
                  <input
                    id="coverImage"
                    name="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                  />
                  {coverImagePreview && (
                    <div className="mt-2">
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-32 object-cover rounded-xl"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Sending Confirmation...' : 'Send Confirmation Email'}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Account Details Form (for invitation signup or after email confirmation) */}
        {(!isDirectAdminSignup || step === 'account') && (
          <form className="mt-8 space-y-6" onSubmit={handleAccountSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                  {invitationEmail && (
                    <span className="text-xs text-gray-500 ml-2">(Invitation email - cannot be changed)</span>
                  )}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    readOnly={!!invitationEmail}
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400 ${
                      invitationEmail ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="Create a password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/auth/signin" className="font-medium text-pink-600 hover:text-pink-500">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
