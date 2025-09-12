'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase-client'
import { CheckCircle, XCircle, Loader2, Heart, Mail, Lock, User, Calendar, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/app/components/AuthProvider'

export default function EmailConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [weddingData, setWeddingData] = useState<any>(null)
  const [userData, setUserData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get('token')
        const email = searchParams.get('email')

        console.log('🔍 URL search params:', {
          token,
          email,
          allParams: Object.fromEntries(searchParams.entries())
        })

        if (!token || !email) {
          console.log('❌ Missing required parameters')
          setStatus('error')
          setMessage('Invalid confirmation link - missing required parameters')
          return
        }

        console.log('🔍 Confirming email:', { token, email })

        // Call our API to confirm the email and get wedding data
        const response = await fetch('/api/auth/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('Confirmation API error:', data)
          setStatus('error')
          setMessage(data.message || 'Failed to confirm email')
          return
        }

        if (data.success) {
          if (data.weddingData) {
            // This is a wedding signup confirmation - show the account creation form
            setWeddingData(data.weddingData)
            setStatus('form')
            setMessage('Please complete your account setup')
          } else {
            // Regular email confirmation
            setStatus('success')
            setMessage('Email confirmed successfully! You can now sign in.')
            
            // Redirect to sign in page after 3 seconds
            setTimeout(() => {
              router.push('/auth/signin')
            }, 3000)
          }
        } else {
          setStatus('error')
          setMessage(data.message || 'Failed to confirm email')
        }
      } catch (error) {
        console.error('Confirmation error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred')
      }
    }

    confirmEmail()
  }, [searchParams, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userData.password !== userData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (userData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)

    try {
      // Create the final account and wedding
      const response = await fetch('/api/auth/confirm-wedding-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: searchParams.get('token'),
          email: searchParams.get('email'),
          name: userData.name,
          password: userData.password,
          weddingData: weddingData
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Account and wedding created successfully!')
        const loginSuccess = await login(searchParams.get('email')!, userData.password)
        if (loginSuccess) {
          router.push(`/weddings/${result.wedding.id}/manage`)
        }
      } else {
        toast.error(result.message || 'Failed to create account')
      }
    } catch (error) {
      console.error('Account creation error:', error)
      toast.error('An error occurred during account creation')
    } finally {
      setIsLoading(false)
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
            Complete Your Account Setup
          </h2>
          {weddingData && (
            <div className="mt-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <p className="text-sm text-gray-600 mb-2">You're creating an account for:</p>
              <div className="text-left space-y-1">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="font-medium text-gray-900">{weddingData.name}</span>
                </div>
                {weddingData.date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(weddingData.date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {weddingData.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{weddingData.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {status === 'loading' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirming Email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'form' && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                    value={userData.name}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-400"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    readOnly
                    value={searchParams.get('email') || ''}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed"
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
                    value={userData.password}
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
                    value={userData.confirmPassword}
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
                {isLoading ? 'Creating Account & Wedding...' : 'Create Account & Wedding'}
              </button>
            </div>
          </form>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Confirmed!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to sign in page...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirmation Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
