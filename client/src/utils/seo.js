// Lightweight, dependency-free SEO helpers.
// They keep <head> meta tags, canonical link and JSON-LD structured data in
// sync with the current route so search engines can index every page (and,
// through the sitemap, every product) as it is published.

const SITE_NAME = 'SMART Centre Cameroon'

function siteOrigin() {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

export function toAbsoluteUrl(url) {
  if (!url) return ''
  const value = String(url).trim()
  if (/^(https?:)?\/\//i.test(value)) return value
  if (typeof window === 'undefined') return value
  return `${siteOrigin()}${value.startsWith('/') ? '' : '/'}${value}`
}

function currentCanonical() {
  if (typeof window === 'undefined') return ''
  // Canonical without query string / hash keeps duplicate URLs from competing.
  return `${siteOrigin()}${window.location.pathname}`
}

function upsertMeta(attr, key, content) {
  if (typeof document === 'undefined' || content == null || content === '') return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', String(content))
}

function upsertLink(rel, href) {
  if (typeof document === 'undefined' || !href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Update the document head for the current page.
 */
export function setSeo({ title, description, image, url, type = 'website', keywords } = {}) {
  if (typeof document === 'undefined') return
  const canonical = url || currentCanonical()
  const absImage = image ? toAbsoluteUrl(image) : ''

  if (title) document.title = title
  if (description) upsertMeta('name', 'description', description)
  if (keywords) upsertMeta('name', 'keywords', keywords)
  upsertLink('canonical', canonical)

  if (title) upsertMeta('property', 'og:title', title)
  if (description) upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:type', type)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:site_name', SITE_NAME)
  if (absImage) upsertMeta('property', 'og:image', absImage)

  upsertMeta('name', 'twitter:card', absImage ? 'summary_large_image' : 'summary')
  if (title) upsertMeta('name', 'twitter:title', title)
  if (description) upsertMeta('name', 'twitter:description', description)
  if (absImage) upsertMeta('name', 'twitter:image', absImage)
}

/**
 * Create/replace a JSON-LD <script> identified by `id`. Passing null removes it.
 */
export function setJsonLd(id, data) {
  if (typeof document === 'undefined') return
  let el = document.getElementById(id)
  if (!data) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/**
 * Organization + WebSite (with a sitelinks search box) structured data.
 * Injected once, site-wide, so the brand and on-site search are discoverable.
 */
export function setOrganizationJsonLd({ shopName = SITE_NAME, shopEmail, shopPhone } = {}) {
  const origin = siteOrigin()
  setJsonLd('ld-website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: shopName,
    url: origin || undefined,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  })
  setJsonLd('ld-organization', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: shopName,
    url: origin || undefined,
    logo: toAbsoluteUrl('/scc-logo.jpeg'),
    email: shopEmail || undefined,
    telephone: shopPhone || undefined
  })
}

/**
 * Product structured data for a product detail page.
 */
export function setProductJsonLd(product, { image, price, currency = 'XAF' } = {}) {
  if (!product) return
  const offerAvailability = Number(product.stock || 0) > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock'
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: image ? [toAbsoluteUrl(image)] : undefined,
    sku: product.sku || product.id,
    category: product.category || undefined,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: Number(price ?? product.price ?? 0),
      availability: offerAvailability,
      url: currentCanonical()
    }
  }
  if (Number(product.reviewCount || 0) > 0 && Number(product.averageRating || 0) > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.averageRating),
      reviewCount: Number(product.reviewCount)
    }
  }
  setJsonLd('ld-product', data)
}

export function clearProductJsonLd() {
  setJsonLd('ld-product', null)
}
