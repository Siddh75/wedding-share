"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Building2, Check, XCircle, Mail, Phone, Globe, Filter, RefreshCcw } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Application {
  id: string
  business_name: string
  business_type: string
  contact_person: string
  email: string
  phone?: string
  website?: string
  description?: string
  status: 'pending' | 'approved' | 'rejected'
  payment_verified: boolean
  submitted_at: string
  reviewed_at?: string
}

export default function AdminApprovalsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    if (!loading && (!user || user.role !== 'application_admin')) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    fetchApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const url = new URL('/api/applications', window.location.origin)
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter)
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load applications')
      setApplications(data.applications || [])
    } catch (e: any) {
      toast.error(e?.message || 'Error loading applications')
    } finally {
      setIsLoading(false)
    }
  }

  const approve = async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}/approve`, { 
        method: 'POST',
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to approve')
      toast.success('Application approved')
      fetchApplications()
    } catch (e: any) {
      toast.error(e?.message || 'Error approving')
    }
  }

  if (loading || (!user || user.role !== 'application_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Approvals</h1>
              <p className="text-gray-600 mt-2">Review and approve applications from venues and studios</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={fetchApplications}
                className="inline-flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">Try changing the filter or check back later.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">{app.business_name}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {app.business_type.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            app.status === 'approved' ? 'bg-green-100 text-green-800' : app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="mt-2 text-gray-600">
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="inline-flex items-center space-x-2"><Mail className="w-4 h-4" /><span>{app.email}</span></span>
                            {app.phone && <span className="inline-flex items-center space-x-2"><Phone className="w-4 h-4" /><span>{app.phone}</span></span>}
                            {app.website && <span className="inline-flex items-center space-x-2"><Globe className="w-4 h-4" /><span className="truncate max-w-[240px]">{app.website}</span></span>}
                          </div>
                          {app.description && (
                            <p className="mt-2 text-sm">{app.description}</p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">Submitted: {new Date(app.submitted_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => approve(app.id)}
                          disabled={app.status === 'approved'}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
