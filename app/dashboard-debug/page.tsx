'use client'

import { useAuth } from '@/app/components/AuthProvider'
import { useEffect, useState } from 'react'

export default function DashboardDebug() {
  const { user, loading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    setDebugInfo({
      user,
      loading,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      cookies: typeof document !== 'undefined' ? document.cookie : 'server'
    })
  }, [user, loading])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? `${user.name} (${user.role})` : 'Not logged in'}</p>
            <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
            <p><strong>User Email:</strong> {user?.email || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Links</h2>
          <div className="space-y-2">
            <a href="/" className="block text-blue-600 hover:underline">Home Page</a>
            <a href="/dashboard" className="block text-blue-600 hover:underline">Dashboard (Original)</a>
            <a href="/weddings/manage" className="block text-blue-600 hover:underline">Manage Weddings</a>
            <a href="/auth/signin" className="block text-blue-600 hover:underline">Sign In</a>
            <a href="/simple-test" className="block text-blue-600 hover:underline">Simple Test</a>
          </div>
        </div>
      </div>
    </div>
  )
}
