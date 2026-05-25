import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import Locations from '../components/Locations'
import ProductCard from '../components/ProductCard'
import { formatXAF } from '../utils/format'
import { useLanguage } from '../i18n/LanguageContext'

const INITIAL_HERO_IMAGE = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920'

export default function Home({ products, settings, addToCart, toggleWishlist, isInWishlist, loading }) {
  const { t } = useLanguage()
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
    description: hero?.description || t('heroDescription'),
    primaryButtonText: hero?.primaryButtonText || t('shopNow'),
    secondaryButtonText: hero?.secondaryButtonText || t('browseProducts'),
    backgroundImage: hero?.backgroundImage || INITIAL_HERO_IMAGE
  }

  const heroStats = [
    { value: stats?.totalProducts ?? products.length, label: t('productsListed') },
    { value: stats?.totalInStock ?? 0, label: t('itemsInStock') },
    { value: formatXAF(settings.freeShippingThreshold), label: t('freeShippingFrom') }
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
              if (event.currentTarget.src !== INITIAL_HERO_IMAGE) event.currentTarget.src = INITIAL_HERO_IMAGE
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
            { title: t('fastDeliveryTitle'), desc: t('fastDeliveryDesc') },
            { title: t('paymentTitle'), desc: t('paymentDesc') },
            { title: t('supportTitle'), desc: t('supportDesc', { phone: settings.shopPhone }) }
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
              <p className="text-sm font-semibold uppercase text-blue-700">{t('featured')}</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-950">{t('featuredTitle')}</h2>
            </div>
            <Link to="/products" className="hidden sm:inline-flex rounded-md border border-gray-300 px-4 py-2 font-semibold hover:bg-white">
              {t('viewAll')}
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-72 rounded-2xl bg-white border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <h3 className="text-lg font-bold text-gray-950">{t('noProductsYet')}</h3>
              <p className="mt-2 text-gray-600">{t('ownerCanAdd')}</p>
            </div>
          )}
        </div>
      </section>

      <Locations />
    </main>
  )
}
