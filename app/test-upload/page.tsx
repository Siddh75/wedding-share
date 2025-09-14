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
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const data = await response.json()
      console.log('📥 Upload response:', data)
      
      setResult({
        status: response.status,
        data: data
      })
    } catch (error) {
      console.error('❌ Test upload error:', error)
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
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
