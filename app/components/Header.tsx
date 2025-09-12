'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import Link from 'next/link'
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Bell,
  Plus,
  Home,
  Heart,
  Users,
  Image as ImageIcon,
  DollarSign,
  Play,
  Shield
} from 'lucide-react'
import { cn, getInitials } from '@/app/lib/utils'

export default function Header() {
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Navigation items for non-authenticated users
  const publicNavigation = [
    { name: 'Home', href: '/', icon: Home },
    // { name: 'Pricing', href: '/pricing', icon: DollarSign },
    { name: 'Demo', href: '/demo', icon: Play },
  ]

      // Navigation items for authenticated users
    const authenticatedNavigation = [
      { name: 'Home', href: '/', icon: Home },
      ...(user?.role === 'super_admin' ? [
        { name: 'Weddings', href: '/weddings/manage', icon: Heart }
      ] : []),
      ...(user?.role === 'application_admin' ? [
        { name: 'Super Admins', href: '/admin/super-admins', icon: Shield },
        { name: 'Direct Admins', href: '/admin/direct-users', icon: Users }
      ] : []),
      { name: 'Dashboard', href: '/dashboard', icon: Home }
    ]

  const handleSignOut = async () => {
    await logout()
    setIsUserMenuOpen(false)
  }

  // Determine which navigation to show
  const navigation = user ? authenticatedNavigation : publicNavigation

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                WeddingShare
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications - Only show for authenticated users */}
            {user && (
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {getInitials(user.name || 'U')}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      Role: {user.role.replace('_', ' ').toUpperCase()}
                    </div>
                    {user.role === 'admin' && (
                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Heart className="w-4 h-4" />
                        <span>My Wedding</span>
                      </Link>
                    )}
                    {user.role === 'application_admin' && (
                      <Link
                        href="/admin/super-admins"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Super Admins</span>
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="text-gray-600 hover:text-pink-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 text-gray-600 hover:text-pink-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon && <item.icon className="w-5 h-5" />}
                <span>{item.name}</span>
              </Link>
            ))}
            {/* Create Wedding Button - Only show for super admin on mobile */}
            {user && user.role === 'super_admin' && (
              <Link
                href="/weddings/create"
                className="flex items-center space-x-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Plus className="w-5 h-5" />
                <span>Create Wedding</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

