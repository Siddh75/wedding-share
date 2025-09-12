'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function WeddingTest() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [weddings, setWeddings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testAuth()
  }, [])

  const testAuth = async () => {
    try {
      const response = await fetch('/api/test/auth')
      const result = await response.json()
      setAuthStatus(result)
      
      if (result.success) {
        testWeddings()
      }
    } catch (error) {
      console.error('Auth test failed:', error)
      setAuthStatus({ success: false, error: error })
    } finally {
      setLoading(false)
    }
  }

  const testWeddings = async () => {
    try {
      const response = await fetch('/api/test/weddings')
      const result = await response.json()
      setWeddings(result.weddings || [])
    } catch (error) {
      console.error('Wedding test failed:', error)
    }
  }

  const createWedding = async () => {
    try {
      const response = await fetch('/api/test/weddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Wedding',
          description: 'A test wedding for media upload',
          date: '2025-06-15',
          location: 'Test Venue'
        })
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('Wedding created!')
        testWeddings() // Refresh the list
      } else {
        toast.error(result.message || 'Failed to create wedding')
      }
    } catch (error) {
      console.error('Create wedding failed:', error)
      toast.error('Failed to create wedding')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Dashboard</h1>
      
      {/* Authentication Status */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(authStatus, null, 2)}
        </pre>
      </div>

      {/* Weddings */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Weddings</h2>
          <button
            onClick={createWedding}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Test Wedding
          </button>
        </div>
        
        {weddings.length === 0 ? (
          <p className="text-gray-500">No weddings found. Create one to test media upload.</p>
        ) : (
          <div className="space-y-2">
            {weddings.map((wedding) => (
              <div key={wedding.id} className="p-3 bg-gray-50 rounded">
                <p className="font-medium">{wedding.name}</p>
                <p className="text-sm text-gray-600">ID: {wedding.id}</p>
                <p className="text-sm text-gray-600">Date: {wedding.date}</p>
                <a 
                  href={`/weddings/${wedding.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Go to Wedding Gallery →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}




