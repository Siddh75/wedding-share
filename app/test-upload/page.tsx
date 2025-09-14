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
      
      const formData = new FormData()
      formData.append('file', testFile)
      formData.append('weddingId', 'test-wedding-id')
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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload Test Page</h1>
        
        <div className="space-y-4">
          <button
            onClick={testAuth}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test Authentication
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
