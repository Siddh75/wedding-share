'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/components/AuthProvider'
import { toast } from 'react-hot-toast'
import { 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  Settings, 
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { validateSubdomain, getWeddingUrl } from '@/app/lib/subdomain-utils'

interface Wedding {
  id: string
  name: string
  subdomain: string
  status: string
}

export default function SubdomainManagement() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const weddingId = params.id as string

  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newSubdomain, setNewSubdomain] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (weddingId) {
      fetchWedding()
    }
  }, [weddingId])

  const fetchWedding = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/weddings/${weddingId}`)
      const result = await response.json()

      if (result.success) {
        setWedding(result.wedding)
        setNewSubdomain(result.wedding.subdomain || '')
      } else {
        toast.error('Failed to load wedding details')
        router.push('/weddings/manage')
      }
    } catch (error) {
      console.error('Error fetching wedding:', error)
      toast.error('Failed to load wedding details')
      router.push('/weddings/manage')
    } finally {
      setIsLoading(false)
    }
  }

  const validateSubdomainInput = async (subdomain: string) => {
    if (!subdomain) {
      setValidationError('')
      return
    }

    setIsValidating(true)
    setValidationError('')

    // Client-side validation
    const validation = validateSubdomain(subdomain)
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid subdomain')
      setIsValidating(false)
      return
    }

    // Server-side validation for uniqueness
    try {
      const response = await fetch(`/api/weddings/validate-subdomain?subdomain=${encodeURIComponent(subdomain)}&exclude=${weddingId}`)
      const result = await response.json()

      if (!result.success) {
        setValidationError(result.message || 'Subdomain is not available')
      }
    } catch (error) {
      console.error('Error validating subdomain:', error)
      setValidationError('Error validating subdomain')
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubdomainChange = (value: string) => {
    setNewSubdomain(value)
    setCopied(false)
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateSubdomainInput(value)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleUpdateSubdomain = async () => {
    if (!newSubdomain || !wedding) return

    const validation = validateSubdomain(newSubdomain)
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid subdomain')
      return
    }

    try {
      setIsUpdating(true)
      const response = await fetch(`/api/weddings/${weddingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subdomain: newSubdomain
        }),
      })

      const result = await response.json()

      if (result.success) {
        setWedding({ ...wedding, subdomain: newSubdomain })
        toast.success('Subdomain updated successfully!')
        setValidationError('')
      } else {
        toast.error(result.message || 'Failed to update subdomain')
      }
    } catch (error) {
      console.error('Error updating subdomain:', error)
      toast.error('Failed to update subdomain')
    } finally {
      setIsUpdating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const generateNewSubdomain = () => {
    if (!wedding) return
    
    const baseName = wedding.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const newSubdomain = `${baseName}-${randomSuffix}`
    
    setNewSubdomain(newSubdomain)
    validateSubdomainInput(newSubdomain)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wedding details...</p>
        </div>
      </div>
    )
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wedding Not Found</h1>
          <p className="text-gray-600 mb-4">The wedding you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/weddings/manage')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Weddings
          </button>
        </div>
      </div>
    )
  }

  const currentUrl = wedding.subdomain ? getWeddingUrl(wedding.subdomain) : null
  const isSubdomainChanged = newSubdomain !== wedding.subdomain
  const canUpdate = newSubdomain && !validationError && !isValidating && isSubdomainChanged

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/weddings/${weddingId}/manage`)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Subdomain Management</h1>
                <p className="text-gray-600">{wedding.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Settings</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Current Subdomain Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Current Subdomain</h2>
            </div>
            
            {wedding.subdomain ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Your wedding URL:</p>
                    <p className="font-mono text-lg text-gray-900">{currentUrl}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentUrl || '')}
                    className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy URL"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                
                <a
                  href={currentUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Visit your wedding site</span>
                </a>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Subdomain Set</h3>
                <p className="text-gray-600 mb-4">Your wedding doesn't have a custom subdomain yet.</p>
                <button
                  onClick={generateNewSubdomain}
                  className="inline-flex items-center space-x-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Generate Subdomain</span>
                </button>
              </div>
            )}
          </div>

          {/* Subdomain Editor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-6 h-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Update Subdomain</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
                  Subdomain
                </label>
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      id="subdomain"
                      value={newSubdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      placeholder="e.g., sarah-michael-wedding"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                        validationError ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {validationError && (
                      <p className="mt-1 text-sm text-red-600">{validationError}</p>
                    )}
                    {isValidating && (
                      <p className="mt-1 text-sm text-gray-500">Validating...</p>
                    )}
                  </div>
                  <button
                    onClick={generateNewSubdomain}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Generate new subdomain"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Your wedding will be accessible at: <span className="font-mono text-pink-600">
                    {newSubdomain ? `${newSubdomain}.weddingshare.com` : 'subdomain.weddingshare.com'}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <p>• Subdomains can only contain lowercase letters, numbers, and hyphens</p>
                  <p>• Must be between 3-50 characters long</p>
                  <p>• Cannot start or end with a hyphen</p>
                </div>
                <button
                  onClick={handleUpdateSubdomain}
                  disabled={!canUpdate || isUpdating}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    canUpdate && !isUpdating
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isUpdating ? 'Updating...' : 'Update Subdomain'}
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">About Subdomains</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Subdomains give your wedding a unique, memorable URL that's easy to share with guests</p>
              <p>• Once set, guests can access your wedding directly at your custom subdomain</p>
              <p>• You can change your subdomain at any time, but the old URL will no longer work</p>
              <p>• Subdomains make it easier for guests to remember and share your wedding site</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
