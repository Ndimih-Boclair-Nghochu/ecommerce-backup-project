export function formatXAF(amount = 0) {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} XAF`
}

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200'

export function getProductImage(product) {
  return product?.image || product?.imageUrl || product?.image_url || product?.images?.[0]?.url || DEFAULT_PRODUCT_IMAGE
}
