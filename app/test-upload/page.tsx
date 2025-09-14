'use client'

import { useState } from 'react'

export default function TestUpload() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testUpload = async () => {
    setLoading(true)
    try {
      // Create a simple test file
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      // Use the wedding ID from your logs: 0841b34a-d327-4f87-8a42-b07050468ded
      const formData = new FormData()
      formData.append('file', testFile)
      formData.append('weddingId', '0841b34a-d327-4f87-8a42-b07050468ded')
      formData.append('description', 'Test upload')

      console.log('🧪 Testing upload API...')
      console.log('🧪 File details:', {
        name: testFile.name,
        size: testFile.size,
        type: testFile.type
      })
      console.log('🧪 Wedding ID:', '0841b34a-d327-4f87-8a42-b07050468ded')
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('📥 Upload response:', data)
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      })
    } catch (error) {
      console.error('❌ Test upload error:', error)
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    } finally {
      setLoading(false)
    }
  }

  const testAuth = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })
      const data = await response.json()
      console.log('🔐 Auth response:', data)
      setResult({
        auth: data
      })
    } catch (error) {
      console.error('❌ Auth test error:', error)
    }
  }

  const testEnv = async () => {
    try {
      const response = await fetch('/api/debug/env')
      const data = await response.json()
      console.log('🔧 Environment check:', data)
      setResult({
        environment: data
      })
    } catch (error) {
      console.error('❌ Environment test error:', error)
    }
  }

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'couple@wedding.com',
          password: 'couple123'
        }),
        credentials: 'include'
      })
      const data = await response.json()
      console.log('🔐 Login response:', data)
      setResult({
        login: data
      })
    } catch (error) {
      console.error('❌ Login test error:', error)
    }
  }

  const testCreateWedding = async () => {
    try {
      const response = await fetch('/api/weddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Wedding',
          date: '2024-12-25',
          location: 'Test Location',
          description: 'Test wedding for upload testing',
          adminEmail: 'couple@wedding.com'
        }),
        credentials: 'include'
      })
      const data = await response.json()
      console.log('💒 Create wedding response:', data)
      setResult({
        createWedding: data
      })
    } catch (error) {
      console.error('❌ Create wedding test error:', error)
    }
  }

  const testCloudinary = async () => {
    try {
      const response = await fetch('/api/debug/cloudinary')
      const data = await response.json()
      console.log('☁️ Cloudinary test response:', data)
      setResult({
        cloudinary: data
      })
    } catch (error) {
      console.error('❌ Cloudinary test error:', error)
    }
  }

  const testWedding = async () => {
    try {
      const response = await fetch('/api/weddings/0841b34a-d327-4f87-8a42-b07050468ded', {
        credentials: 'include'
      })
      const data = await response.json()
      console.log('💒 Wedding test response:', data)
      setResult({
        wedding: {
          status: response.status,
          data: data
        }
      })
    } catch (error) {
      console.error('❌ Wedding test error:', error)
    }
  }

  const testSession = async () => {
    try {
      console.log('🧪 Testing session cookie directly...')
      
      // Check if session cookie exists in document.cookie
      const cookies = document.cookie
      console.log('🍪 All cookies:', cookies)
      
      const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session-token='))
      console.log('🍪 Session cookie:', sessionCookie)
      
      if (sessionCookie) {
        const sessionValue = sessionCookie.split('=')[1]
        console.log('🍪 Session value:', sessionValue)
        
        try {
          const parsedSession = JSON.parse(decodeURIComponent(sessionValue))
          console.log('🍪 Parsed session:', parsedSession)
          setResult({
            status: 200,
            data: {
              cookieFound: true,
              sessionValue: sessionValue,
              parsedSession: parsedSession,
              domain: window.location.hostname,
              protocol: window.location.protocol,
              fullUrl: window.location.href
            }
          })
        } catch (parseError) {
          console.error('❌ Session parse error:', parseError)
          setResult({
            status: 200,
            data: {
              cookieFound: true,
              sessionValue: sessionValue,
              parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
            }
          })
        }
      } else {
        setResult({
          status: 200,
          data: {
            cookieFound: false,
            allCookies: cookies,
            domain: window.location.hostname,
            protocol: window.location.protocol,
            fullUrl: window.location.href
          }
        })
      }
    } catch (error) {
      console.error('❌ Session test error:', error)
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const testManualCookie = async () => {
    try {
      console.log('🧪 Testing manual cookie setting...')
      
      // Manually set a test cookie
      const testUser = {
        id: 'test-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      }
      
      const testCookieValue = JSON.stringify(testUser)
      document.cookie = `session-token=${encodeURIComponent(testCookieValue)}; path=/; max-age=3600; samesite=lax`
      
      console.log('🍪 Manual cookie set:', testCookieValue)
      console.log('🍪 Current cookies after setting:', document.cookie)
      
      // Now test if the session API can read it
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })
      const data = await response.json()
      console.log('📥 Session API response after manual cookie:', data)
      
      setResult({
        status: 200,
        data: {
          manualCookieSet: true,
          cookieValue: testCookieValue,
          sessionApiResponse: data,
          allCookies: document.cookie
        }
      })
    } catch (error) {
      console.error('❌ Manual cookie test error:', error)
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const testSessionDebug = async () => {
    try {
      console.log('🧪 Testing session API with debug info...')
      
      // Set a test cookie
      const testUser = {
        id: 'debug-456',
        email: 'debug@example.com',
        name: 'Debug User',
        role: 'admin'
      }
      
      const testCookieValue = JSON.stringify(testUser)
      document.cookie = `session-token=${encodeURIComponent(testCookieValue)}; path=/; max-age=3600; samesite=lax`
      
      console.log('🍪 Debug cookie set:', testCookieValue)
      console.log('🍪 All cookies:', document.cookie)
      
      // Test the session API
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('📥 Session API response status:', response.status)
      console.log('📥 Session API response headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('📥 Session API response data:', data)
      
      setResult({
        status: 200,
        data: {
          debugTest: true,
          cookieValue: testCookieValue,
          allCookies: document.cookie,
          responseStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          sessionApiResponse: data
        }
      })
    } catch (error) {
      console.error('❌ Session debug test error:', error)
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const testDebugSession = async () => {
    try {
      console.log('🧪 Testing debug session API...')
      
      // Set a test cookie
      const testUser = {
        id: 'debug-789',
        email: 'debug2@example.com',
        name: 'Debug User 2',
        role: 'admin'
      }
      
      const testCookieValue = JSON.stringify(testUser)
      document.cookie = `session-token=${encodeURIComponent(testCookieValue)}; path=/; max-age=3600; samesite=lax`
      
      console.log('🍪 Debug cookie set:', testCookieValue)
      console.log('🍪 All cookies:', document.cookie)
      
      // Test the debug session API
      const response = await fetch('/api/debug/session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('📥 Debug Session API response status:', response.status)
      const data = await response.json()
      console.log('📥 Debug Session API response data:', data)
      
      setResult({
        status: 200,
        data: {
          debugSessionTest: true,
          cookieValue: testCookieValue,
          allCookies: document.cookie,
          responseStatus: response.status,
          debugSessionResponse: data
        }
      })
    } catch (error) {
      console.error('❌ Debug session test error:', error)
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload Test Page</h1>
        
        <div className="space-y-4">
          <button
            onClick={testLogin}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Login (couple@wedding.com)
          </button>
          
          <button
            onClick={testCreateWedding}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Create Test Wedding
          </button>
          
          <button
            onClick={testAuth}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test Authentication
          </button>
          
          <button
            onClick={testEnv}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Check Environment Variables
          </button>
          
          <button
            onClick={testCloudinary}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
          >
            Test Cloudinary Connection
          </button>
          
          <button
            onClick={testWedding}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Test Wedding Access
          </button>
          
          <button
            onClick={testSession}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Test Session Cookie
          </button>
          
          <button
            onClick={testManualCookie}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Test Manual Cookie
          </button>
          
          <button
            onClick={testSessionDebug}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Test Session Debug
          </button>
          
          <button
            onClick={testDebugSession}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Test Debug Session API
          </button>
          
          <button
            onClick={testUpload}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Upload API'}
          </button>
        </div>

        {result && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Cookies:</strong> {typeof document !== 'undefined' ? document.cookie : 'Server-side'}</p>
            <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side'}</p>
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
