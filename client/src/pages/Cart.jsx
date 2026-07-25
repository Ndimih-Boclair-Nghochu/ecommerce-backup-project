import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import { formatXAF, getProductImage } from '../utils/format'

const emptyBuyer = {
  name: '',
  email: '',
  phone: '',
  country: 'Cameroon',
  region: '',
  city: '',
  address: '',
  notes: ''
}

// A short list of suggestions; the field accepts any country the buyer types.
const COUNTRY_SUGGESTIONS = [
  'Cameroon', 'Nigeria', 'Ghana', 'Chad', 'Central African Republic', 'Gabon',
  'Equatorial Guinea', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Senegal',
  'Kenya', 'South Africa', 'United States', 'United Kingdom', 'France', 'Canada'
]

const getAvailability = (item) => item.storeAvailability || item.store_availability || {}

const isProductAvailableAtLocation = (item, location) => {
  const availability = getAvailability(item)
  const locationIds = Object.keys(availability)
  if (!locationIds.length) return true
  return Number(availability[location.id] || 0) > 0
}

const formatPickupLocation = (location) => {
  if (!location) return ''
  return [location.name, location.city].filter(Boolean).join(' - ')
}

function RequiredLabel({ children }) {
  return (
    <label className="block text-sm font-bold text-gray-800 mb-1">
      {children} <span className="text-red-600">*</span>
    </label>
  )
}

export default function Cart({ cart, removeFromCart, updateQuantity, clearCart, subtotal, settings }) {
  const [pickupLocations, setPickupLocations] = useState([])
  const [deliveryOption, setDeliveryOption] = useState('delivery')
  const [pickupLocationId, setPickupLocationId] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [buyer, setBuyer] = useState(emptyBuyer)
  const [errors, setErrors] = useState({})
  const [placingOrder, setPlacingOrder] = useState(false)
  const [successOrder, setSuccessOrder] = useState(null)

  useEffect(() => {
    let active = true
    axios.get('/api/pickup-locations')
      .then((res) => {
        if (!active) return
        setPickupLocations(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => toast.error('Pickup locations could not be loaded'))
    return () => {
      active = false
    }
  }, [])

  const availablePickupLocations = useMemo(
    () => pickupLocations.filter((location) => cart.every((item) => isProductAvailableAtLocation(item, location))),
    [pickupLocations, cart]
  )
  const selectedPickupLocation = useMemo(
    () => availablePickupLocations.find((location) => location.id === pickupLocationId) || availablePickupLocations[0] || null,
    [availablePickupLocations, pickupLocationId]
  )

  // No shipping fees are charged online — delivery is arranged after the order is confirmed.
  const total = subtotal

  useEffect(() => {
    if (!availablePickupLocations.length) return
    if (!pickupLocationId || !availablePickupLocations.some((location) => location.id === pickupLocationId)) {
      setPickupLocationId(availablePickupLocations[0].id)
    }
  }, [availablePickupLocations, pickupLocationId])

  const validateForm = () => {
    const nextErrors = {}
    if (!buyer.name.trim()) nextErrors.name = 'Name is required'
    if (!buyer.email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) nextErrors.email = 'Enter a valid email address'
    if (!buyer.phone.trim()) nextErrors.phone = 'Phone number is required'
    if (deliveryOption === 'delivery') {
      if (!buyer.country.trim()) nextErrors.country = 'Country is required'
      if (!buyer.city.trim()) nextErrors.city = 'City / Town is required'
      if (!buyer.address.trim()) nextErrors.address = 'Street address is required'
    }
    if (deliveryOption === 'pickup' && !selectedPickupLocation) nextErrors.pickupLocation = 'Select a pickup store'
    if (deliveryOption === 'pickup' && !pickupTime) nextErrors.pickupTime = 'Select your pickup time'
    if (!cart.length) nextErrors.cart = 'Your cart is empty'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleBuyerChange = (field, value) => {
    setBuyer((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const chooseDeliveryOption = (option) => {
    setDeliveryOption(option)
    setErrors((current) => ({
      ...current,
      country: undefined,
      city: undefined,
      address: undefined,
      pickupLocation: undefined,
      pickupTime: undefined
    }))
  }

  const composedDeliveryAddress = () => {
    return [buyer.address.trim(), buyer.city.trim(), buyer.region.trim(), buyer.country.trim()]
      .filter(Boolean)
      .join(', ')
  }

  const placeOrder = async (event) => {
    event.preventDefault()
    if (!validateForm()) {
      toast.error('Please fix the highlighted fields')
      return
    }

    const loadingToast = toast.loading('Placing order...')
    setPlacingOrder(true)
    try {
      const pickupLabel = formatPickupLocation(selectedPickupLocation)
      const payload = {
        buyer: {
          name: buyer.name.trim(),
          email: buyer.email.trim(),
          phone: buyer.phone.trim(),
          address: deliveryOption === 'pickup'
            ? (selectedPickupLocation?.address || pickupLabel)
            : composedDeliveryAddress(),
          country: deliveryOption === 'pickup' ? '' : buyer.country.trim(),
          region: deliveryOption === 'pickup' ? '' : buyer.region.trim(),
          city: deliveryOption === 'pickup' ? '' : buyer.city.trim(),
          agencies: [],
          pickupLocation: deliveryOption === 'pickup' ? pickupLabel : '',
          pickupTime: deliveryOption === 'pickup' ? pickupTime : '',
          specialInstructions: buyer.notes.trim()
        },
        // Backend keeps a required "region" column — use the country (or pickup city) for it.
        region: deliveryOption === 'pickup' ? (selectedPickupLocation?.city || 'Pickup') : (buyer.country.trim() || 'N/A'),
        country: deliveryOption === 'pickup' ? '' : buyer.country.trim(),
        deliveryOption,
        pickupLocation: deliveryOption === 'pickup' ? pickupLabel : '',
        pickupTime: deliveryOption === 'pickup' ? pickupTime : '',
        paymentMethod: 'manual_confirmation',
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          selectedVariant: item.selectedVariant?.color || '',
          selectedImageUrl: item.selectedVariant?.url || getProductImage(item),
          image: getProductImage(item)
        }))
      }
      const response = await axios.post('/api/orders', payload)
      setSuccessOrder(response.data)
      clearCart()
      setBuyer(emptyBuyer)
      setDeliveryOption('delivery')
      setPickupTime('')
      setPickupLocationId('')
      toast.success('Order received')
    } catch (err) {
      const responseErrors = err.response?.data?.errors || []
      if (responseErrors.length) {
        const mapped = {}
        responseErrors.forEach((error) => {
          mapped[String(error.field || '').replace('buyer.', '')] = error.message
        })
        setErrors(mapped)
      }
      toast.error(err.response?.data?.error || 'Failed to place order')
    } finally {
      toast.dismiss(loadingToast)
      setPlacingOrder(false)
    }
  }

  if (!cart.length && !successOrder) {
    return (
      <main className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4 py-16">
        <section className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-gray-950">Your cart is empty</h1>
          <p className="mt-3 text-gray-600">Browse products and add the items you want to order.</p>
          <Link to="/products" className="mt-6 inline-flex rounded-md bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">
            Browse Products
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link to="/products" className="text-sm font-semibold text-blue-700 hover:text-blue-900">Back to products</Link>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-950">Shopping Cart</h1>
        </div>

        {successOrder && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-5">
            <h2 className="text-xl font-bold text-green-900">Order received</h2>
            <p className="mt-2 text-green-800">
              Order ID: <span className="font-mono font-bold">{successOrder.id}</span>
            </p>
            <p className="mt-2 text-green-800">
              Your order has been received. We will contact you shortly to confirm payment and fulfillment.
            </p>
            <Link to="/track-order" className="mt-4 inline-flex rounded-md bg-green-700 px-4 py-2 font-bold text-white hover:bg-green-800">
              Track Order
            </Link>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            {cart.map((item) => (
              <article key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-[88px_1fr] gap-4">
                  <img src={getProductImage(item)} alt={item.name} className="h-24 w-24 rounded-md bg-gray-100 object-cover object-center" />
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-gray-950">{item.name}</h2>
                        <p className="mt-1 text-sm text-gray-600">{formatXAF(item.price)}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="text-sm font-semibold text-red-700">
                        Remove
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-9 w-9 rounded-md border border-gray-300 font-bold">-</button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item.id, Number(event.target.value) || 1)}
                          className="h-9 w-16 rounded-md border border-gray-300 text-center font-bold"
                        />
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-9 w-9 rounded-md border border-gray-300 font-bold">+</button>
                      </div>
                      <p className="font-bold text-gray-950">{formatXAF(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm h-fit">
            <h2 className="text-xl font-bold text-gray-950">Checkout</h2>
            <p className="mt-2 text-sm text-gray-600">
              No online payment is collected here. The shop will contact you after the order is received to confirm delivery and any delivery fee.
            </p>

            <form onSubmit={placeOrder} className="mt-6 space-y-4">
              <div>
                <RequiredLabel>Full Name</RequiredLabel>
                <input value={buyer.name} onChange={(event) => handleBuyerChange('name', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <RequiredLabel>Email</RequiredLabel>
                <input type="email" value={buyer.email} onChange={(event) => handleBuyerChange('email', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <RequiredLabel>Phone</RequiredLabel>
                <input type="tel" value={buyer.phone} onChange={(event) => handleBuyerChange('phone', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" placeholder="+237 6 52 882 753" />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <RequiredLabel>Fulfillment</RequiredLabel>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => chooseDeliveryOption('delivery')}
                    className={`rounded-md px-3 py-2 text-sm font-bold transition ${deliveryOption === 'delivery' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-700 hover:text-gray-950'}`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseDeliveryOption('pickup')}
                    className={`rounded-md px-3 py-2 text-sm font-bold transition ${deliveryOption === 'pickup' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-700 hover:text-gray-950'}`}
                  >
                    Pickup
                  </button>
                </div>
              </div>

              {deliveryOption === 'delivery' ? (
                <>
                  <div>
                    <RequiredLabel>Country</RequiredLabel>
                    <input
                      list="country-suggestions"
                      value={buyer.country}
                      onChange={(event) => handleBuyerChange('country', event.target.value)}
                      placeholder="e.g. Cameroon"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none"
                    />
                    <datalist id="country-suggestions">
                      {COUNTRY_SUGGESTIONS.map((country) => <option key={country} value={country} />)}
                    </datalist>
                    {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">State / Region</label>
                      <input value={buyer.region} onChange={(event) => handleBuyerChange('region', event.target.value)} placeholder="e.g. North West" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
                    </div>
                    <div>
                      <RequiredLabel>City / Town</RequiredLabel>
                      <input value={buyer.city} onChange={(event) => handleBuyerChange('city', event.target.value)} placeholder="e.g. Bamenda" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
                      {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                    </div>
                  </div>

                  <div>
                    <RequiredLabel>Street Address</RequiredLabel>
                    <textarea value={buyer.address} onChange={(event) => handleBuyerChange('address', event.target.value)} rows="3" placeholder="House number, street, neighbourhood, landmark…" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <RequiredLabel>Pickup Store</RequiredLabel>
                    <select
                      value={selectedPickupLocation?.id || ''}
                      onChange={(event) => setPickupLocationId(event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none"
                    >
                      {availablePickupLocations.length ? (
                        availablePickupLocations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {formatPickupLocation(location)}
                          </option>
                        ))
                      ) : (
                        <option value="">No pickup store available for these items</option>
                      )}
                    </select>
                    {selectedPickupLocation?.address && (
                      <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900">
                        {selectedPickupLocation.address}
                      </p>
                    )}
                    {errors.pickupLocation && <p className="mt-1 text-sm text-red-600">{errors.pickupLocation}</p>}
                  </div>

                  <div>
                    <RequiredLabel>Pickup Time</RequiredLabel>
                    <input
                      type="datetime-local"
                      value={pickupTime}
                      onChange={(event) => {
                        setPickupTime(event.target.value)
                        setErrors((current) => ({ ...current, pickupTime: undefined }))
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none"
                    />
                    {errors.pickupTime && <p className="mt-1 text-sm text-red-600">{errors.pickupTime}</p>}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Notes</label>
                <textarea value={buyer.notes} onChange={(event) => handleBuyerChange('notes', event.target.value)} rows="2" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-700 focus:outline-none" />
              </div>

              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">{formatXAF(subtotal)}</span></div>
                <div className="flex justify-between text-sm">
                  <span>{deliveryOption === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                  <span className="font-semibold text-gray-500">
                    {deliveryOption === 'pickup' ? 'Free' : 'Arranged on confirmation'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatXAF(total)}</span>
                </div>
                {deliveryOption === 'delivery' && (
                  <p className="text-xs text-gray-500">Any delivery fee is confirmed with you by the shop after your order.</p>
                )}
              </div>

              {errors.cart && <p className="text-sm text-red-600">{errors.cart}</p>}
              <button
                type="submit"
                disabled={placingOrder}
                className="w-full rounded-md bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:bg-gray-300"
              >
                {placingOrder ? 'Submitting...' : 'Place Order'}
              </button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  )
}
