import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import { formatXAF, getProductImage } from '../utils/format'

const emptyBuyer = {
  name: '',
  email: '',
  phone: '',
  address: '',
  agencies: [''],
  notes: ''
}

const normalizeTown = (value = '') => String(value || '').trim().toLowerCase()

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
  const [shippingFees, setShippingFees] = useState({})
  const [pickupLocations, setPickupLocations] = useState([])
  const [region, setRegion] = useState(settings?.mainShopTown || 'Bamenda')
  const [deliveryOption, setDeliveryOption] = useState('delivery')
  const [pickupLocationId, setPickupLocationId] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [buyer, setBuyer] = useState(emptyBuyer)
  const [errors, setErrors] = useState({})
  const [placingOrder, setPlacingOrder] = useState(false)
  const [successOrder, setSuccessOrder] = useState(null)

  useEffect(() => {
    let active = true
    axios.get('/api/shipping-fees')
      .then((res) => {
        if (!active) return
        const fees = res.data || {}
        setShippingFees(fees)
        setRegion((current) => current || settings?.mainShopTown || Object.keys(fees)[0] || 'Bamenda')
      })
      .catch(() => toast.error('Shipping fees could not be loaded'))
    return () => {
      active = false
    }
  }, [settings?.mainShopTown])

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

  const mainTown = settings?.mainShopTown || 'Bamenda'
  const regions = useMemo(() => Object.keys(shippingFees).sort((a, b) => a.localeCompare(b)), [shippingFees])
  const availablePickupLocations = useMemo(
    () => pickupLocations.filter((location) => cart.every((item) => isProductAvailableAtLocation(item, location))),
    [pickupLocations, cart]
  )
  const selectedPickupLocation = useMemo(
    () => availablePickupLocations.find((location) => location.id === pickupLocationId) || availablePickupLocations[0] || null,
    [availablePickupLocations, pickupLocationId]
  )
  const selectedPickupCity = selectedPickupLocation?.city || ''
  const cartAvailableInRegion = useMemo(
    () => pickupLocations.some((location) => (
      normalizeTown(location.city) === normalizeTown(region)
      && cart.every((item) => isProductAvailableAtLocation(item, location))
    )),
    [pickupLocations, cart, region]
  )
  const showAgencies = deliveryOption === 'delivery'
    && !(cartAvailableInRegion || normalizeTown(region) === normalizeTown(mainTown))
  const freeShippingThreshold = Number(settings?.freeShippingThreshold || 100000)
  const baseShipping = Number(shippingFees[region] ?? 0)
  const freeShipping = deliveryOption === 'delivery' && subtotal >= freeShippingThreshold
  const shipping = deliveryOption === 'pickup' ? 0 : (freeShipping ? 0 : baseShipping)
  const total = subtotal + shipping

  useEffect(() => {
    if (!availablePickupLocations.length) return
    if (!pickupLocationId || !availablePickupLocations.some((location) => location.id === pickupLocationId)) {
      setPickupLocationId(availablePickupLocations[0].id)
    }
  }, [availablePickupLocations, pickupLocationId])

  useEffect(() => {
    if (deliveryOption === 'pickup' && selectedPickupCity) {
      setRegion(selectedPickupCity)
    }
  }, [deliveryOption, selectedPickupCity])

  const validateForm = () => {
    const nextErrors = {}
    if (!buyer.name.trim()) nextErrors.name = 'Name is required'
    if (!buyer.email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) nextErrors.email = 'Enter a valid email address'
    if (!buyer.phone.trim()) nextErrors.phone = 'Phone number is required'
    if (deliveryOption === 'delivery' && !buyer.address.trim()) nextErrors.address = 'Delivery address is required'
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

  const handleAgencyChange = (index, value) => {
    setBuyer((current) => {
      const agencies = [...current.agencies]
      agencies[index] = value
      return { ...current, agencies }
    })
  }

  const addAgencyField = () => {
    setBuyer((current) => ({ ...current, agencies: [...current.agencies, ''] }))
  }

  const removeAgencyField = (index) => {
    setBuyer((current) => ({
      ...current,
      agencies: current.agencies.length > 1 ? current.agencies.filter((_, itemIndex) => itemIndex !== index) : ['']
    }))
  }

  const chooseDeliveryOption = (option) => {
    setDeliveryOption(option)
    setErrors((current) => ({ ...current, address: undefined, pickupLocation: undefined, pickupTime: undefined }))
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
      const normalizedAgencies = buyer.agencies.map((agency) => agency.trim()).filter(Boolean)
      const payload = {
        buyer: {
          name: buyer.name.trim(),
          email: buyer.email.trim(),
          phone: buyer.phone.trim(),
          address: deliveryOption === 'pickup'
            ? (selectedPickupLocation?.address || pickupLabel)
            : buyer.address.trim(),
          agencies: showAgencies ? normalizedAgencies : [],
          pickupLocation: deliveryOption === 'pickup' ? pickupLabel : '',
          pickupTime: deliveryOption === 'pickup' ? pickupTime : '',
          specialInstructions: buyer.notes.trim()
        },
        region: deliveryOption === 'pickup' && selectedPickupCity ? selectedPickupCity : region,
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
          <Link to="/products" className="mt-6 inline-flex rounded-md bg-stone-900 px-5 py-3 font-bold text-white hover:bg-stone-950">
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
          <Link to="/products" className="text-sm font-semibold text-amber-700 hover:text-stone-900">Back to products</Link>
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
                  <img src={getProductImage(item)} alt={item.name} className="h-24 w-24 rounded-md object-cover bg-gray-100" />
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
              No online payment is collected here. The shop will contact you after the order is received.
            </p>

            <form onSubmit={placeOrder} className="mt-6 space-y-4">
              <div>
                <RequiredLabel>Full Name</RequiredLabel>
                <input value={buyer.name} onChange={(event) => handleBuyerChange('name', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-700 focus:outline-none" />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <RequiredLabel>Email</RequiredLabel>
                <input type="email" value={buyer.email} onChange={(event) => handleBuyerChange('email', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-700 focus:outline-none" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <RequiredLabel>Phone</RequiredLabel>
                <input type="tel" value={buyer.phone} onChange={(event) => handleBuyerChange('phone', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-700 focus:outline-none" placeholder="+237 6 52 882 753" />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <RequiredLabel>Fulfillment</RequiredLabel>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => chooseDeliveryOption('delivery')}
                    className={`rounded-md px-3 py-2 text-sm font-bold transition ${deliveryOption === 'delivery' ? 'bg-white text-stone-900 shadow-sm' : 'text-gray-700 hover:text-gray-950'}`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseDeliveryOption('pickup')}
                    className={`rounded-md px-3 py-2 text-sm font-bold transition ${deliveryOption === 'pickup' ? 'bg-white text-stone-900 shadow-sm' : 'text-gray-700 hover:text-gray-950'}`}
                  >
                    Pickup
                  </button>
                </div>
              </div>

              {deliveryOption === 'delivery' ? (
                <>
                  <div>
                    <RequiredLabel>Delivery Region</RequiredLabel>
                    <select value={region} onChange={(event) => setRegion(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-700 focus:outline-none">
                      {(regions.length ? regions : [mainTown]).map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <RequiredLabel>Delivery Address</RequiredLabel>
                    <textarea value={buyer.address} onChange={(event) => handleBuyerChange('address', event.target.value)} rows="3" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-700 focus:outline-none" />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>

                  {showAgencies && (
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Nearby collection agencies</label>
                      <p className="mb-2 text-xs text-gray-500">Add one or more agencies if you want delivery through a local pickup point.</p>
                      <div className="space-y-2">
                        {buyer.agencies.map((agency, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              value={agency}
                              onChange={(event) => handleAgencyChange(index, event.target.value)}
                              placeholder={`Agency ${index + 1}`}
                              className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-amber-700 focus:outline-none"
                            />
                            {buyer.agencies.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAgencyField(index)}
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addAgencyField} className="mt-2 text-sm font-bold text-amber-700 hover:text-stone-900">
                        Add another agency
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <RequiredLabel>Pickup Store</RequiredLabel>
                    <select
                      value={selectedPickupLocation?.id || ''}
                      onChange={(event) => setPickupLocationId(event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-700 focus:outline-none"
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
                      <p className="mt-2 rounded-md bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-900">
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-700 focus:outline-none"
                    />
                    {errors.pickupTime && <p className="mt-1 text-sm text-red-600">{errors.pickupTime}</p>}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Notes</label>
                <textarea value={buyer.notes} onChange={(event) => handleBuyerChange('notes', event.target.value)} rows="2" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-700 focus:outline-none" />
              </div>

              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">{formatXAF(subtotal)}</span></div>
                <div className="flex justify-between text-sm">
                  <span>{deliveryOption === 'pickup' ? 'Pickup' : 'Shipping'}</span>
                  <span className="font-semibold">
                    {deliveryOption === 'pickup' ? 'Free' : (freeShipping ? 'Free' : formatXAF(shipping))}
                  </span>
                </div>
                {freeShipping && <p className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800 inline-flex">Free shipping</p>}
                <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatXAF(total)}</span>
                </div>
              </div>

              {errors.cart && <p className="text-sm text-red-600">{errors.cart}</p>}
              <button
                type="submit"
                disabled={placingOrder}
                className="w-full rounded-md bg-stone-900 px-5 py-3 font-bold text-white hover:bg-stone-950 disabled:bg-gray-300"
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
