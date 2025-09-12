'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function TestConfirmationPage() {
  const searchParams = useSearchParams()
  const [testToken, setTestToken] = useState('')
  const [testEmail, setTestEmail] = useState('')

  const allParams = Object.fromEntries(searchParams.entries())

  const testConfirmation = async () => {
    if (!testToken || !testEmail) {
      alert('Please enter both token and email')
      return
    }

    try {
      const response = await fetch('/api/auth/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: testToken, email: testEmail }),
      })

      const data = await response.json()
      console.log('Test confirmation result:', data)
      alert(`Result: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error('Test confirmation error:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Confirmation Link Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">URL Parameters</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(allParams, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Manual Test</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Token (User ID):</label>
              <input
                type="text"
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email:</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter email"
              />
            </div>
            <button
              onClick={testConfirmation}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Confirmation
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check the URL parameters above to see what the confirmation page receives</li>
            <li>If parameters are missing, the issue is with URL generation or email content</li>
            <li>Use the manual test above to test the confirmation API directly</li>
            <li>Check the browser console and server logs for detailed error messages</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
