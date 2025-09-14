'use client'

import { useState } from 'react'

export default function DebugLogin() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    try {
      console.log('🔐 Testing login...')
      
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
      
      console.log('🔐 Login response status:', response.status)
      const data = await response.json()
      console.log('🔐 Login response data:', data)
      
      setResult({
        login: {
          status: response.status,
          data: data
        }
      })
    } catch (error) {
      console.error('❌ Login error:', error)
      setResult({
        login: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const testSession = async () => {
    try {
      console.log('🔐 Testing session...')
      
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })
      
      console.log('🔐 Session response status:', response.status)
      const data = await response.json()
      console.log('🔐 Session response data:', data)
      
      setResult((prev: any) => ({
        ...prev,
        session: {
          status: response.status,
          data: data
        }
      }))
    } catch (error) {
      console.error('❌ Session error:', error)
      setResult((prev: any) => ({
        ...prev,
        session: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
  }

  const testCookies = () => {
    console.log('🍪 Current cookies:', document.cookie)
    setResult((prev: any) => ({
      ...prev,
      cookies: document.cookie
    }))
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Login Debug Page</h1>
        
        <div className="space-y-4">
          <button
            onClick={testLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Test Login (couple@wedding.com)'}
          </button>
          
          <button
            onClick={testSession}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Test Session Check
          </button>
          
          <button
            onClick={testCookies}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Check Cookies
          </button>
        </div>

        {result && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Results</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Test Login" first</li>
            <li>Check the result - should show success</li>
            <li>Click "Check Cookies" - should show session-token</li>
            <li>Click "Test Session Check" - should show authenticated: true</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
