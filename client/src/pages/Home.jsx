import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import Locations from '../components/Locations'
import { formatXAF, getProductImage } from '../utils/format'

const INITIAL_HERO_IMAGE = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920'

function ProductCard({ product, addToCart, toggleWishlist, isInWishlist }) {
  const image = getProductImage(product)

  return (
    <article className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          {product.stock <= 0 && (
            <div className="absolute inset-x-0 top-0 bg-red-600 text-white text-center text-xs font-bold py-2">
              Out of Stock
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.isNew && <span className="rounded-full bg-amber-400 px-2 py-1 text-xs font-bold text-gray-900">New</span>}
            {product.mostOrdered && <span className="rounded-full bg-blue-700 px-2 py-1 text-xs font-bold text-white">Popular</span>}
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase text-blue-700">{product.category || 'Product'}</p>
          <h3 className="mt-1 font-bold text-gray-950 line-clamp-2">{product.name}</h3>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{product.description}</p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <span className="text-lg font-bold text-blue-800">{formatXAF(product.price)}</span>
            <span className={`text-xs font-semibold ${product.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Unavailable'}
            </span>
          </div>
          {product.stock > 0 && (
            <div className="mt-3 h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-blue-700" style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }} />
            </div>
          )}
        </div>
      </Link>
      <div className="px-4 pb-4 flex gap-2">
        <button
          type="button"
          onClick={() => addToCart(product)}
          disabled={product.stock <= 0}
          className="flex-1 rounded-md bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500"
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          className={`w-11 rounded-md border text-lg ${isInWishlist(product.id) ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          ♥
        </button>
      </div>
    </article>
  )
}

export default function Home({ products, settings, addToCart, toggleWishlist, isInWishlist, loading }) {
  const [hero, setHero] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([axios.get('/api/hero-section'), axios.get('/api/stats')])
      .then(([heroRes, statsRes]) => {
        if (!active) return
        setHero(heroRes.data)
        setStats(statsRes.data)
      })
      .catch(() => toast.error('Some homepage data could not be loaded'))
    return () => {
      active = false
    }
  }, [])

  const featuredProducts = useMemo(() => {
    const marked = products.filter((product) => product.mostOrdered || product.isNew)
    return (marked.length ? marked : products).slice(0, 8)
  }, [products])

  const heroData = {
    badge: hero?.badge || 'Special Offers This Season',
    title: settings.shopName || 'MyShop',
    description: hero?.description || 'Shop premium electronics and accessories in Cameroon. Your order is received first, then our team contacts you to confirm payment and delivery.',
    primaryButtonText: hero?.primaryButtonText || 'Shop Now',
    secondaryButtonText: hero?.secondaryButtonText || 'Browse Products',
    backgroundImage: hero?.backgroundImage || INITIAL_HERO_IMAGE
  }

  const heroStats = [
    { value: stats?.totalProducts ?? products.length, label: 'Products listed' },
    { value: stats?.totalInStock ?? 0, label: 'Items in stock' },
    { value: formatXAF(settings.freeShippingThreshold), label: 'Free shipping from' }
  ]

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 py-12 text-white sm:py-16 md:py-20 lg:py-24">
        <div className="absolute inset-0 opacity-10">
          <img
            src={heroData.backgroundImage}
            alt=""
            className="h-full w-full object-cover"
            onError={(event) => {
              if (event.currentTarget.src !== INITIAL_HERO_IMAGE) {
                event.currentTarget.src = INITIAL_HERO_IMAGE
              }
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <div className="inline-flex rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg sm:px-6 sm:text-base">
            {heroData.badge}
          </div>
          <h1 className="mx-auto mt-5 max-w-4xl text-3xl font-bold leading-tight sm:mt-6 sm:text-4xl md:text-5xl lg:text-6xl">
            {heroData.title}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl px-2 text-base text-gray-100 sm:mt-6 sm:text-lg md:text-xl">
            {heroData.description}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 px-2 sm:mt-8 sm:gap-4">
            <Link to="/products" className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-orange-600 sm:px-8 sm:py-3 sm:text-base md:text-lg">
              {heroData.primaryButtonText}
            </Link>
            <Link to="/products" className="rounded-lg border-2 border-white px-6 py-2 text-sm font-bold text-white transition hover:bg-white/10 sm:px-8 sm:py-3 sm:text-base">
              {heroData.secondaryButtonText}
            </Link>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3 sm:mt-16 sm:gap-6">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-lg bg-white/15 p-3 backdrop-blur sm:p-6">
                <div className="mb-1 text-xl font-bold sm:mb-2 sm:text-3xl">{stat.value}</div>
                <div className="text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Fast Cameroon delivery', desc: 'Shipping options for Bamenda, Buea, Douala, Yaoundé and more.' },
            { title: 'Manual payment confirmation', desc: 'Place your order and the shop contacts you before payment and delivery.' },
            { title: 'Real support', desc: `Call ${settings.shopPhone} for order support and product questions.` }
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-gray-950">{feature.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold uppercase text-blue-700">Featured</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-950">Products customers should see first</h2>
            </div>
            <Link to="/products" className="hidden sm:inline-flex rounded-md border border-gray-300 px-4 py-2 font-semibold hover:bg-white">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-72 rounded-lg bg-white border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <h3 className="text-lg font-bold text-gray-950">No products yet</h3>
              <p className="mt-2 text-gray-600">The owner can add real products from the admin dashboard.</p>
            </div>
          )}
        </div>
      </section>

      <Locations />
    </main>
  )
}
