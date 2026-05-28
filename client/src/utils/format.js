export function formatXAF(amount = 0) {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} XAF`
}

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200'

export function resolveAssetUrl(value) {
  const url = typeof value === 'string' ? value.trim() : ''
  if (!url) return ''
  if (/^(data:|blob:|https?:\/\/|\/\/)/i.test(url)) return url

  const normalizedUrl = url.startsWith('uploads/') ? `/${url}` : url
  if (!normalizedUrl.startsWith('/')) return normalizedUrl

  const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || ''
  const apiBaseUrl = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl
  return apiBaseUrl ? `${apiBaseUrl}${normalizedUrl}` : normalizedUrl
}

export function getProductImage(product) {
  const image =
    product?.image ||
    product?.imageUrl ||
    product?.image_url ||
    product?.images?.find((entry) => entry?.url)?.url

  return resolveAssetUrl(image) || DEFAULT_PRODUCT_IMAGE
}
