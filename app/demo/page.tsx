'use client'

import { useState } from 'react'
import { 
  Camera, 
  Users, 
  Heart, 
  Calendar, 
  MapPin, 
  Upload, 
  Share2, 
  Star,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function Demo() {
  const [activeTab, setActiveTab] = useState('gallery')
  const [selectedEvent, setSelectedEvent] = useState('all')

  const demoWedding = {
    name: 'Sarah & John Wedding',
    date: '2024-06-15',
    location: 'Grand Hotel, New York',
    totalPhotos: 156,
    totalGuests: 23,
    events: [
      { id: '1', name: 'Ceremony', photos: 45 },
      { id: '2', name: 'Reception', photos: 89 },
      { id: '3', name: 'Rehearsal Dinner', photos: 22 }
    ]
  }

  const demoPhotos = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
      event: 'Ceremony',
      uploadedBy: 'Sarah',
      likes: 12
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
      event: 'Reception',
      uploadedBy: 'John',
      likes: 18
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
      event: 'Ceremony',
      uploadedBy: 'Emily',
      likes: 15
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
      event: 'Reception',
      uploadedBy: 'Michael',
      likes: 22
    },
    {
      id: '5',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
      event: 'Rehearsal Dinner',
      uploadedBy: 'Jessica',
      likes: 8
    },
    {
      id: '6',
      url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
      event: 'Ceremony',
      uploadedBy: 'David',
      likes: 14
    }
  ]

  const filteredPhotos = selectedEvent === 'all' 
    ? demoPhotos 
    : demoPhotos.filter(photo => photo.event === selectedEvent)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-pink-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              WeddingShare Demo
            </h1>
            <p className="text-xl md:text-2xl mb-6 opacity-90">
              Experience the magic of sharing wedding memories together
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/weddings/create"
                className="inline-flex items-center px-6 py-3 bg-white text-pink-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
              >
                <Heart className="w-5 h-5 mr-2" />
                Create Your Wedding
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-pink-600 transition-colors"
              >
                <Users className="w-5 h-5 mr-2" />
                Join a Wedding
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wedding Info */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {demoWedding.name}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Join us in celebrating our special day! Share your photos and memories with us.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-lg">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {new Date(demoWedding.date).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {demoWedding.location}
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {demoWedding.totalGuests} guests
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600">{demoWedding.totalPhotos}</div>
              <div className="text-gray-600">Photos & Videos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{demoWedding.totalGuests}</div>
              <div className="text-gray-600">Guests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{demoWedding.events.length}</div>
              <div className="text-gray-600">Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">156</div>
              <div className="text-gray-600">Approved</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="inline-flex items-center px-6 py-3 bg-pink-600 text-white font-semibold rounded-xl hover:bg-pink-700 transition-colors shadow-lg">
              <Upload className="w-5 h-5 mr-2" />
              Share Photos
            </button>
            <button className="inline-flex items-center px-6 py-3 border-2 border-pink-600 text-pink-600 font-semibold rounded-xl hover:bg-pink-50 transition-colors">
              <Share2 className="w-5 h-5 mr-2" />
              Invite Guests
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'gallery', name: 'Photo Gallery', icon: Camera },
                { id: 'events', name: 'Events', icon: Calendar },
                { id: 'guests', name: 'Guests', icon: Users },
                { id: 'questions', name: 'Questions', icon: Star }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'gallery' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Photo Gallery</h3>
                  <div className="flex space-x-2">
                    {['all', ...demoWedding.events.map(e => e.name)].map((event) => (
                      <button
                        key={event}
                        onClick={() => setSelectedEvent(event)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          selectedEvent === event
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {event === 'all' ? 'All Photos' : event}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPhotos.map((photo) => (
                    <div key={photo.id} className="group relative bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={photo.url}
                        alt={`Wedding photo ${photo.id}`}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">{photo.uploadedBy}</span>
                          <span className="text-xs text-gray-500">{photo.event}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-pink-600 transition-colors">
                            <Heart className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-600">{photo.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Wedding Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {demoWedding.events.map((event) => (
                    <div key={event.id} className="bg-gray-50 rounded-xl p-6 text-center">
                      <Calendar className="w-12 h-12 text-pink-600 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{event.name}</h4>
                      <p className="text-2xl font-bold text-pink-600">{event.photos}</p>
                      <p className="text-sm text-gray-600">photos</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'guests' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Wedding Guests</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Guest Management</h4>
                    <p className="text-gray-600 mb-6">
                      In the full version, you can manage guest access, send invitations, and track RSVPs.
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        {demoWedding.totalGuests} guests invited
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-blue-600 mr-2" />
                        {Math.floor(demoWedding.totalGuests * 0.8)} confirmed
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Guest Questions</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-center">
                    <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Custom Questions</h4>
                    <p className="text-gray-600 mb-6">
                      Create custom questions for your wedding guests to answer.
                    </p>
                    <div className="space-y-3 text-left max-w-md mx-auto">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-700">What's your favorite memory of us?</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-700">Rate our wedding planning (1-5)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-700">What advice would you give us?</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Create Your Wedding Gallery?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start sharing memories with your loved ones today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/weddings/create"
              className="inline-flex items-center justify-center bg-white text-pink-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-pink-600 transition-all duration-200"
            >
              Join a Wedding
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}










