import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import ProductCard from '../components/ProductCard'
import { formatXAF, getProductImage, resolveAssetUrl } from '../utils/format'
import { useLanguage } from '../i18n/LanguageContext'

export default function ProductDetail({ addToCart, toggleWishlist, isInWishlist, settings }) {
  const { id } = useParams()
  const { t, translateProduct } = useLanguage()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reviewSummary, setReviewSummary] = useState({ reviews: [], averageRating: 0, reviewCount: 0 })
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      axios.get(`/api/products/${id}`),
      axios.get('/api/products'),
      axios.get(`/api/products/${id}/reviews`)
    ])
      .then(([productRes, productsRes, reviewsRes]) => {
        if (!active) return
        const item = productRes.data
        setProduct(item)
        const firstVariant = item.images?.[0] || null
        setSelectedVariant(firstVariant)
        setSelectedImage(firstVariant?.url || getProductImage(item))
        setRelated((productsRes.data || []).filter((entry) => entry.category === item.category && entry.id !== item.id).slice(0, 4))
        setReviewSummary(reviewsRes.data || { reviews: [], averageRating: 0, reviewCount: 0 })
      })
      .catch(() => toast.error('Product could not be loaded'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  const displayProduct = product ? translateProduct(product) : null
  const variants = useMemo(() => product?.images?.filter((image) => image?.url) || [], [product])
  const availableRegions = product?.availableRegions || ['ALL']
  const regionLimited = availableRegions.length > 0 && !availableRegions.includes('ALL')
  const reviews = reviewSummary.reviews || []

  useEffect(() => {
    if (displayProduct) document.title = `${displayProduct.displayName} - ${settings?.shopName || 'MyShop'}`
  }, [displayProduct, settings?.shopName])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-2">
          <div className="aspect-square rounded-2xl bg-white border border-gray-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-10 rounded bg-white border border-gray-200 animate-pulse" />
            <div className="h-6 w-40 rounded bg-white border border-gray-200 animate-pulse" />
            <div className="h-32 rounded bg-white border border-gray-200 animate-pulse" />
          </div>
        </div>
      </main>
    )
  }

  if (!product || !displayProduct) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-950">{t('productNotFound')}</h1>
          <Link to="/products" className="mt-5 inline-flex rounded-md bg-blue-700 px-5 py-3 font-bold text-white">{t('backProducts')}</Link>
        </div>
      </main>
    )
  }

  const outOfStock = product.stock <= 0

  const handleReviewSubmit = async (event) => {
    event.preventDefault()
    const comment = reviewForm.comment.trim()
    if (!comment) {
      toast.error('Please write a short comment')
      return
    }

    setSubmittingReview(true)
    try {
      await axios.post(`/api/products/${product.id}/reviews`, {
        customerName: reviewForm.customerName.trim(),
        rating: Number(reviewForm.rating),
        comment
      })
      const response = await axios.get(`/api/products/${product.id}/reviews`)
      setReviewSummary(response.data || { reviews: [], averageRating: 0, reviewCount: 0 })
      setReviewForm({ customerName: '', rating: 5, comment: '' })
      toast.success('Thanks for reviewing this product')
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.error || 'Review could not be saved')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/products" className="text-sm font-semibold text-blue-700 hover:text-blue-900">{t('backProducts')}</Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <img src={resolveAssetUrl(selectedImage) || getProductImage(product)} alt={displayProduct.displayName} className="h-full w-full object-contain p-3" />
              {outOfStock && <div className="absolute inset-x-0 top-0 bg-red-600 py-3 text-center font-bold text-white">{t('outOfStock')}</div>}
            </div>
            {variants.length > 1 && (
              <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-3">
                {variants.map((variant) => (
                  <button key={`${variant.color}-${variant.url}`} type="button" onClick={() => { setSelectedVariant(variant); setSelectedImage(variant.url) }} className={`aspect-square overflow-hidden rounded-xl border-2 ${selectedVariant?.url === variant.url ? 'border-blue-700' : 'border-gray-200'}`} aria-label={`Select ${variant.color || 'variant'}`}>
                    <img src={resolveAssetUrl(variant.url)} alt={variant.color || displayProduct.displayName} className="h-full w-full bg-white object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {displayProduct.displayCategory && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{displayProduct.displayCategory}</span>}
              {product.isNew && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-gray-900">{t('new')}</span>}
              {product.mostOrdered && <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-bold text-white">{t('popular')}</span>}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-950">{displayProduct.displayName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-amber-50 px-3 py-1 font-black text-amber-700">
                {reviewSummary.averageRating ? `${reviewSummary.averageRating}/5` : 'No ratings yet'}
              </span>
              <span className="font-semibold text-gray-500">
                {reviewSummary.reviewCount} customer review{reviewSummary.reviewCount === 1 ? '' : 's'}
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-blue-800">{formatXAF(product.price)}</p>

            <div className={`mt-4 rounded-md px-4 py-3 text-sm font-semibold ${outOfStock ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              {outOfStock ? t('outOfStock') : t('inStockCount', { count: product.stock })}
            </div>

            {regionLimited && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {t('availableOnly', { regions: availableRegions.join(', ') })}
              </div>
            )}

            <div className="mt-6">
              <h2 className="font-bold text-gray-950">{t('description')}</h2>
              <p className="mt-2 text-gray-600 leading-relaxed">{displayProduct.displayDescription || t('noDescription')}</p>
            </div>

            {variants.length > 1 && (
              <div className="mt-6">
                <h2 className="font-bold text-gray-950 mb-3">{t('variant')}</h2>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <button key={`${variant.color}-button`} type="button" onClick={() => { setSelectedVariant(variant); setSelectedImage(variant.url) }} className={`rounded-md border px-4 py-2 text-sm font-semibold ${selectedVariant?.url === variant.url ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-gray-300 text-gray-700'}`}>
                      {variant.color || t('option')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-11 w-11 rounded-md border border-gray-300 text-xl font-bold">-</button>
              <input type="number" min="1" max={product.stock || 1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(product.stock || 1, Number(event.target.value) || 1)))} className="h-11 w-20 rounded-md border border-gray-300 text-center font-bold" />
              <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock || 1, value + 1))} className="h-11 w-11 rounded-md border border-gray-300 text-xl font-bold">+</button>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_56px] gap-3">
              <button type="button" disabled={outOfStock} onClick={() => addToCart(product, quantity, selectedVariant)} className="rounded-md bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500">
                {t('addToCart')}
              </button>
              <button type="button" onClick={() => toggleWishlist(product)} className={`rounded-md border text-2xl ${isInWishlist(product.id) ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`} aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}>
                &hearts;
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={handleReviewSubmit} className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Customer feedback</p>
            <h2 className="mt-2 text-2xl font-black text-gray-950">Rate this product</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">Share your experience so other customers can choose with confidence.</p>

            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-800 mb-1">Your name</label>
              <input
                value={reviewForm.customerName}
                onChange={(event) => setReviewForm((current) => ({ ...current, customerName: event.target.value }))}
                placeholder="Customer"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-800 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewForm((current) => ({ ...current, rating }))}
                    className={`h-10 w-10 rounded-full border text-lg font-black transition ${
                      reviewForm.rating >= rating ? 'border-amber-400 bg-amber-100 text-amber-700' : 'border-gray-300 text-gray-400 hover:bg-gray-50'
                    }`}
                    aria-label={`${rating} star rating`}
                  >
                    &#9733;
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-800 mb-1">Comment</label>
              <textarea
                value={reviewForm.comment}
                onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                rows="4"
                placeholder="Tell us what you liked, how it arrived, or who it is best for."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button type="submit" disabled={submittingReview} className="mt-5 w-full rounded-md bg-blue-700 px-5 py-3 font-black text-white transition hover:bg-blue-800 disabled:bg-gray-300">
              {submittingReview ? 'Saving...' : 'Submit review'}
            </button>
          </form>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Reviews</p>
                <h2 className="mt-2 text-2xl font-black text-gray-950">What customers are saying</h2>
              </div>
              <div className="text-sm font-bold text-gray-600">
                Average: <span className="text-amber-700">{reviewSummary.averageRating || 0}/5</span>
              </div>
            </div>

            {reviews.length ? (
              <div className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <article key={review.id} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-black text-gray-950">{review.customerName}</h3>
                        <p className="text-xs font-semibold text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-black text-amber-700">{review.rating}/5</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">{review.comment}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <h3 className="text-lg font-black text-gray-950">No reviews yet</h3>
                <p className="mt-2 text-sm text-gray-600">Be the first customer to rate this product.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="text-2xl font-bold text-gray-950 mb-4">{t('related')}</h2>
        {related.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {related.map((item) => <ProductCard key={item.id} product={item} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />)}
          </div>
        ) : (
          <p className="rounded-lg border border-gray-200 bg-white p-5 text-gray-600">{t('noRelated')}</p>
        )}
      </section>
    </main>
  )
}
