'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkSession = async () => {
    try {
      console.log('🔐 AuthProvider: Checking session...')
      console.log('🔐 AuthProvider: Current URL:', window.location.href)
      console.log('🔐 AuthProvider: Document cookies:', document.cookie)
      
      const response = await fetch('/api/auth/session', {
        credentials: 'include', // Important: include cookies
      })
      
      console.log('🔐 AuthProvider: Session API response status:', response.status)
      const data = await response.json()
      console.log('🔐 AuthProvider: Session response:', data)
      
      if (data.authenticated && data.user) {
        console.log('🔐 AuthProvider: Setting user from session:', data.user)
        setUser(data.user)
      } else {
        console.log('🔐 AuthProvider: No authenticated user')
        setUser(null)
      }
    } catch (error) {
      console.error('🔐 AuthProvider: Session check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthProvider: Starting login for:', email)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important: include cookies
      })

      const result = await response.json()
      console.log('🔐 AuthProvider: Login response:', result)
      
      if (result.success && result.user) {
        console.log('🔐 AuthProvider: Setting user:', result.user)
        setUser(result.user)
        console.log('🔐 AuthProvider: User set, now checking session...')
        // Re-check session to ensure consistency
        await checkSession()
        console.log('🔐 AuthProvider: Session check completed')
        return true
      }
      
      // Check if it's a confirmation error
      if (result.requiresConfirmation) {
        console.log('🔐 AuthProvider: Email confirmation required')
        throw new Error('Email not confirmed')
      }
      
      console.log('🔐 AuthProvider: Login failed')
      return false
    } catch (error) {
      console.error('🔐 AuthProvider: Login error:', error)
      throw error // Re-throw to let the UI handle it
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
