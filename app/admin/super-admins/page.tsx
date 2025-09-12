'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SuperAdminStats {
  id: string
  name: string
  email: string
  created_at: string
  wedding_count: number
  total_storage_mb: number
  total_media_count: number
  last_activity: string
}

interface SummaryStats {
  total_super_admins: number
  total_weddings: number
  total_storage_mb: number
  total_media_files: number
}

export default function SuperAdminManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [superAdmins, setSuperAdmins] = useState<SuperAdminStats[]>([])
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    loadSuperAdminStats()
  }, [])

  const loadSuperAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/super-admins', {
        method: 'GET',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }
        if (response.status === 403) {
          setError('Access denied. Only application admins can view this page.')
          setLoading(false)
          return
        }
        throw new Error(data.message || 'Failed to load data')
      }

      console.log('📦 Received data:', data)
      console.log('👥 Super admins:', data.data.super_admins)
      console.log('📊 Summary:', data.data.summary)
      
      setSuperAdmins(data.data.super_admins)
      setSummary(data.data.summary)
    } catch (err) {
      console.error('Error loading super admin stats:', err)
      setError('Failed to load super admin statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatStorage = (mb: number) => {
    if (mb < 1024) {
      return `${mb} MB`
    } else {
      return `${(mb / 1024).toFixed(2)} GB`
    }
  }

  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/admin/super-admins/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(createForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create super admin')
      }

      // Reset form and hide it
      setCreateForm({ name: '', email: '', password: '' })
      setShowCreateForm(false)
      
      // Reload the data
      await loadSuperAdminStats()
      
      alert('Super admin account created successfully!')
    } catch (err) {
      console.error('Error creating super admin:', err)
      alert(err instanceof Error ? err.message : 'Failed to create super admin account')
    } finally {
      setCreating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading super admin data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Super Admin Management</h1>
              <p className="text-gray-600">Monitor super admin activity, wedding creation, and storage usage</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
            >
              <span>+</span>
              <span>Create Super Admin</span>
            </button>
          </div>
        </div>

        {/* Create Super Admin Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Super Admin</h2>
            <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={createForm.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={createForm.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={createForm.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter password (minimum 6 characters)"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">{summary.total_super_admins}</div>
              <div className="text-gray-600">Total Super Admins</div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{summary.total_weddings}</div>
              <div className="text-gray-600">Total Weddings</div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{formatStorage(summary.total_storage_mb)}</div>
              <div className="text-gray-600">Total Storage</div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{summary.total_media_files}</div>
              <div className="text-gray-600">Total Media Files</div>
            </div>
          </div>
        )}

        {/* Super Admin List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Super Admin Details</h2>
          </div>
          
          {superAdmins.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No super admins found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Super Admin
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weddings
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storage Used
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Media Files
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {superAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{admin.wedding_count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatStorage(admin.total_storage_mb)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{admin.total_media_count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(admin.last_activity)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(admin.created_at)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/weddings/manage')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 mr-4"
          >
            Back to Weddings
          </button>
          <button
            onClick={loadSuperAdminStats}
            className="bg-gray-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-200"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
}
