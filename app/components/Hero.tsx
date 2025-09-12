'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Camera, Users, Calendar, ArrowRight, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from './AuthProvider'

export default function Hero() {
  const [currentImage, setCurrentImage] = useState(0)
  const { user } = useAuth()
  
  const images = [
    '/api/placeholder/800/600/pink',
    '/api/placeholder/800/600/purple',
    '/api/placeholder/800/600/rose'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [images.length])

  const features = [
    {
      icon: Camera,
      title: 'Share Memories',
      description: 'Upload and organize photos and videos from your special day'
    },
    {
      icon: Users,
      title: 'Guest Access',
      description: 'Invite friends and family with secure, private access'
    },
    {
      icon: Calendar,
      title: 'Event Organization',
      description: 'Organize photos by wedding events and moments'
    }
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 bg-pink-200 rounded-full opacity-60"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-60"
          animate={{
            y: [0, 15, 0],
            x: [0, 10, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-12 h-12 bg-rose-200 rounded-full opacity-60"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium"
              >
                <Heart className="w-4 h-4" />
                <span>{user?.role === 'admin' ? 'Manage & Organize' : 'Celebrate Love & Share Memories'}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
              >
                <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">
                  WeddingShare
                </span>
                <br />
                <span className="text-gray-900">
                  {user?.role === 'admin' ? 'Your Wedding Management Hub' : 'Your Digital Wedding Album'}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-xl text-gray-600 max-w-2xl mx-auto"
              >
                {user?.role === 'admin'
                  ? 'Manage your wedding gallery, organize photos, and coordinate with guests in one beautiful platform.'
                  : 'Create beautiful, private photo galleries for your wedding. Invite guests to share memories and relive your special day together.'
                }
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {user ? (
                // Authenticated users see dashboard button
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span>{user.role === 'admin' ? 'Go to My Wedding' : 'Go to Dashboard'}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                // Non-authenticated users see signup button
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              
              <Link
                href="/demo"
                className="inline-flex items-center justify-center space-x-2 border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-pink-300 hover:text-pink-600 transition-all duration-200"
              >
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </Link>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.2 + index * 0.1 }}
                  className="text-center group"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-200">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Image/Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative w-full max-w-lg mx-auto">
              {/* Main Image */}
              <motion.div
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl"
                animate={{ rotateY: [0, 5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-600 opacity-20" />
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                      <Heart className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full w-48 mx-auto" />
                      <div className="h-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full w-32 mx-auto" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Cards */}
              <motion.div
                className="absolute -top-4 -left-4 w-24 h-32 bg-white rounded-xl shadow-lg p-3"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-full h-16 bg-gradient-to-br from-pink-200 to-purple-200 rounded-lg mb-2" />
                <div className="space-y-1">
                  <div className="h-2 bg-gray-200 rounded-full" />
                  <div className="h-2 bg-gray-200 rounded-full w-3/4" />
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -right-4 w-28 h-20 bg-white rounded-xl shadow-lg p-3"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-200 to-blue-200 rounded-full" />
                  <div className="h-3 bg-gray-200 rounded-full w-16" />
                </div>
                <div className="h-2 bg-gray-200 rounded-full w-full" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}






