import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Locations() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/locations')
      setLocations(response.data)
    } catch (err) {
      console.error('Failed to fetch locations:', err)
    } finally {
      setLoading(false)
    }
  }

  const mainStore = locations.find(l => l.isMainStore)
  const branches = locations.filter(l => !l.isMainStore)

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin">⏳</div>
      </div>
    )
  }

  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Visit Our Store</h2>
          <p className="text-gray-600 text-sm sm:text-lg">Find us at convenient locations near you</p>
        </div>

        {/* Main Store */}
        {mainStore && (
          <div className="mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
              🏢 <span>Main Store</span>
            </h3>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="p-4 sm:p-8">
                <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
                  <div className="flex-1">
                    <h4 className="text-lg sm:text-xl font-bold text-blue-600 mb-4">{mainStore.name}</h4>
                    <div className="space-y-3 text-gray-700">
                      <div className="flex gap-3">
                        <span className="text-xl sm:text-2xl">📍</span>
                        <div>
                          <p className="font-semibold text-sm sm:text-base">Address</p>
                          <p className="text-xs sm:text-sm">{mainStore.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl sm:text-2xl">📱</span>
                        <div>
                          <p className="font-semibold text-sm sm:text-base">Phone</p>
                          <p className="text-xs sm:text-sm">{mainStore.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl sm:text-2xl">✉️</span>
                        <div>
                          <p className="font-semibold text-sm sm:text-base">Email</p>
                          <p className="text-xs sm:text-sm">{mainStore.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl sm:text-2xl">🕐</span>
                        <div>
                          <p className="font-semibold text-sm sm:text-base">Hours</p>
                          <p className="text-xs sm:text-sm">{mainStore.hours || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    {mainStore.description && (
                      <p className="mt-4 text-gray-600 italic text-xs sm:text-sm">{mainStore.description}</p>
                    )}
                  </div>
                  {mainStore.lat && mainStore.lng && (
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-4 sm:p-6 h-56 sm:h-64 md:h-auto flex flex-col items-center justify-center text-center">
                        <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">📍</div>
                        <p className="font-semibold text-gray-700">{mainStore.name}</p>
                        <p className="text-sm text-gray-600 mt-2">{mainStore.address}</p>
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(mainStore.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                        >
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branches */}
        {branches.length > 0 && (
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
              🌿 <span>Branch Locations ({branches.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {branches.map(location => (
                <div key={location.id} className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-2xl transition-shadow">
                  <h4 className="text-base sm:text-lg font-bold text-blue-600 mb-3 sm:mb-4">{location.name}</h4>
                  <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                    <div className="flex gap-2">
                      <span>📍</span>
                      <div>
                        <p className="font-semibold text-gray-800">{location.city}</p>
                        <p className="text-xs text-gray-600">{location.address}</p>
                      </div>
                    </div>
                    {location.phone && (
                      <div className="flex gap-2">
                        <span>📱</span>
                        <p>{location.phone}</p>
                      </div>
                    )}
                    {location.email && (
                      <div className="flex gap-2">
                        <span>✉️</span>
                        <p>{location.email}</p>
                      </div>
                    )}
                    {location.hours && (
                      <div className="flex gap-2">
                        <span>🕐</span>
                        <p>{location.hours}</p>
                      </div>
                    )}
                  </div>
                  {location.description && (
                    <p className="mt-3 text-xs text-gray-600 italic">{location.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {locations.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 text-lg">No store locations available at this time.</p>
          </div>
        )}
      </div>
    </section>
  )
}
