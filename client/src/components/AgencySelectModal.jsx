import React, { useState } from 'react'import toast from 'react-hot-toast'


export default function AgencySelectModal({ isOpen, order, onClose, onSelectAgency }) {
  const [selectedAgency, setSelectedAgency] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  console.debug('🔍 AgencySelectModal render', { isOpen, hasOrder: !!order, orderId: order?.id })

  if (!isOpen || !order) {
    if (!isOpen) console.debug('⏭️ Modal not open, skipping render')
    if (!order) console.debug('⏭️ No order, skipping render')
    return null
  }

  // Get agencies from order - handle both string and object formats
  let agencies = order.buyer?.agencies || []
  console.debug('📋 Raw agencies:', agencies)
  
  // Convert string agencies to objects if needed
  agencies = agencies.filter(a => {
    if (typeof a === 'string') return a.trim() !== ''
    if (typeof a === 'object') return a && Object.values(a).some(v => v)
    return false
  }).map(a => {
    if (typeof a === 'string') {
      return { name: a, address: '', phone: '' }
    }
    return a
  })
  
  console.debug('✅ Processed agencies:', agencies)

  const handleSelectAgency = async () => {
    if (selectedAgency === null) {
      toast('Please select an agency')
      return
    }

    setIsLoading(true)
    try {
      await onSelectAgency(selectedAgency)
      setSelectedAgency(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-fadeIn">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center">Select Delivery Agency</h2>
          <p className="text-sm text-gray-600 text-center mt-2">
            Choose which agency the customer should visit for pickup
          </p>
        </div>

        {/* Order Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6 border border-gray-200">
          <p className="text-xs text-gray-600">Order ID</p>
          <p className="font-semibold text-gray-900">{order.id}</p>
          <p className="text-xs text-gray-600 mt-2">Customer</p>
          <p className="font-semibold text-gray-900">{order.buyer?.name || 'Unknown'}</p>
        </div>

        {/* Agencies List */}
        <div className="space-y-3 mb-6">
          {agencies.length > 0 ? (
            agencies.map((agency, index) => (
              <label key={index} className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition hover:bg-blue-50 hover:border-blue-300"
                style={{
                  borderColor: selectedAgency === index ? '#2563eb' : '#e5e7eb',
                  backgroundColor: selectedAgency === index ? '#f0f9ff' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="agency"
                  value={index}
                  checked={selectedAgency === index}
                  onChange={() => setSelectedAgency(index)}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <div className="ml-3 flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{agency.name || `Agency ${index + 1}`}</p>
                  {agency.address && (
                    <p className="text-xs text-gray-600 mt-1">{agency.address}</p>
                  )}
                  {agency.phone && (
                    <p className="text-xs text-gray-600 mt-0.5">📱 {agency.phone}</p>
                  )}
                </div>
              </label>
            ))
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-800">No agencies available for this order</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectAgency}
            disabled={selectedAgency === null || isLoading}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Confirming...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
