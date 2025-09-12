'use client'

import { useState } from 'react'

export default function TestInputs() {
  const [text, setText] = useState('')
  const [email, setEmail] = useState('')
  const [textarea, setTextarea] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Input Field Test</h1>
        
        <div className="bg-white rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Input
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
              placeholder="Type something here..."
            />
            <p className="mt-2 text-sm text-gray-600">Value: {text}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Input
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
              placeholder="email@example.com"
            />
            <p className="mt-2 text-sm text-gray-600">Value: {email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Textarea
            </label>
            <textarea
              value={textarea}
              onChange={(e) => setTextarea(e.target.value)}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
              placeholder="Type a longer message..."
            />
            <p className="mt-2 text-sm text-gray-600">Value: {textarea}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Dropdown
            </label>
            <select className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white">
              <option value="">Select an option</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
