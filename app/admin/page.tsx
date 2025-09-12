'use client'

import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  Users, 
  CreditCard, 
  Settings, 
  BarChart3, 
  Shield, 
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'application_admin')) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'application_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this area.</p>
        </div>
      </div>
    )
  }

  const stats = [
    { name: 'Total Users', value: '2,847', icon: Users, change: '+12%', changeType: 'positive' },
    { name: 'Active Subscriptions', value: '1,234', icon: CreditCard, change: '+8%', changeType: 'positive' },
    { name: 'Pending Approvals', value: '23', icon: AlertCircle, change: '+5', changeType: 'neutral' },
    { name: 'Monthly Revenue', value: '$45,678', icon: TrendingUp, change: '+15%', changeType: 'positive' }
  ]

  const quickActions = [
    { name: 'Manage Plans', href: '/admin/plans', icon: Settings, color: 'bg-blue-500' },
    { name: 'User Approvals', href: '/admin/approvals', icon: Shield, color: 'bg-green-500' },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard, color: 'bg-purple-500' },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, color: 'bg-orange-500' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Application Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your WeddingShare platform</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.icon === TrendingUp ? 'bg-green-100' : 'bg-pink-100'}`}>
                    <stat.icon className={`w-6 h-6 ${stat.icon === TrendingUp ? 'text-green-600' : 'text-pink-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.name}</h3>
                <p className="text-gray-600 text-sm">Manage and configure platform settings</p>
              </a>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">New super admin application received from "Central Park Events"</span>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Subscription plan "Premium Venue" created</span>
                  <span className="text-xs text-gray-400">1 day ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Monthly billing cycle completed - $45,678 collected</span>
                  <span className="text-xs text-gray-400">2 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
