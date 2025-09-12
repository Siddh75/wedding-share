'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase-client'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function EmailConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

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

        // Call our API to confirm the email
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
          setStatus('success')
          setMessage('Email confirmed successfully! You can now sign in.')
          
          // Redirect to sign in page after 3 seconds
          setTimeout(() => {
            router.push('/auth/signin')
          }, 3000)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirming Email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Confirmed!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to sign in page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirmation Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  )
}
