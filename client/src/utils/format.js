export function formatXAF(amount = 0) {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} XAF`
}

export function getProductImage(product) {
  return product?.image || product?.imageUrl || product?.image_url || product?.images?.[0]?.url || '/placeholder.png'
}
