import React, { createContext, useContext, useMemo, useState } from 'react'

const LanguageContext = createContext(null)

const dictionaries = {
  en: {
    home: 'Home', products: 'All Products', track: 'Track Order', wishlist: 'Wishlist', admin: 'Admin',
    cart: 'Cart', menu: 'Menu', close: 'Close', addToCart: 'Add to Cart', addedToCart: 'Added to cart', outOfStock: 'Out of Stock',
    unavailable: 'Unavailable', inStock: 'In Stock', left: '{count} left', inStockCount: '{count} in stock',
    new: 'New', popular: 'Popular', product: 'Product', backHome: 'Back to Home', backProducts: 'Back to Products',
    browseProducts: 'Browse Products', clearAll: 'Clear all', clearFilters: 'Clear Filters', showResults: 'Show Results',
    loadingShop: 'Loading shop data...', heroDescription: 'Shop premium electronics and accessories in Cameroon. Your order is received first, then our team contacts you to confirm payment and delivery.',
    shopNow: 'Shop Now', productsListed: 'Products listed', itemsInStock: 'Items in stock', freeShippingFrom: 'Free shipping from',
    fastDeliveryTitle: 'Fast Cameroon delivery', fastDeliveryDesc: 'Shipping options for Bamenda, Buea, Douala, Yaounde and more.',
    paymentTitle: 'Manual payment confirmation', paymentDesc: 'Place your order and the shop contacts you before payment and delivery.',
    supportTitle: 'Real support', supportDesc: 'Call {phone} for order support and product questions.',
    featured: 'Featured', featuredTitle: 'Products customers should see first', viewAll: 'View All',
    noProductsYet: 'No products yet', ownerCanAdd: 'The owner can add real products from the admin dashboard.',
    showingProducts: 'Showing {shown} of {total} products', searchProducts: 'Search products', filters: 'Filters',
    activeFilters: '{count} active filter{plural}', category: 'Category', priceRange: 'Price Range', minXaf: 'Min XAF',
    maxXaf: 'Max XAF', inStockOnly: 'Show in-stock only', newest: 'Newest', priceLow: 'Price: Low to High',
    priceHigh: 'Price: High to Low', mostPopular: 'Most Popular', inStockFirst: 'In Stock First',
    noProductsFound: 'No products found', changeFilters: 'Try changing your search or clearing filters.',
    productNotFound: 'Product not found', description: 'Description', noDescription: 'No description provided yet.',
    availableOnly: 'Available only in: {regions}', variant: 'Variant', option: 'Option', related: 'Related Products',
    noRelated: 'No related products yet.', emptyWishlist: 'Your wishlist is empty', saveProducts: 'Save products you want to revisit later.',
    savedItems: '{count} saved item{plural}', addAllStock: 'Add All In Stock to Cart',
    footerTagline: 'Premium electronics and accessories in Cameroon.', rights: 'All Rights Reserved.', language: 'Language'
  },
  fr: {
    home: 'Accueil', products: 'Tous les produits', track: 'Suivre commande', wishlist: 'Favoris', admin: 'Admin',
    cart: 'Panier', menu: 'Menu', close: 'Fermer', addToCart: 'Ajouter au panier', addedToCart: 'Ajoute au panier', outOfStock: 'Rupture de stock',
    unavailable: 'Indisponible', inStock: 'En stock', left: '{count} restant(s)', inStockCount: '{count} en stock',
    new: 'Nouveau', popular: 'Populaire', product: 'Produit', backHome: 'Retour a l accueil', backProducts: 'Retour aux produits',
    browseProducts: 'Voir les produits', clearAll: 'Tout effacer', clearFilters: 'Effacer les filtres', showResults: 'Afficher les resultats',
    loadingShop: 'Chargement de la boutique...', heroDescription: 'Achetez des appareils electroniques et accessoires premium au Cameroun. Votre commande est recue, puis notre equipe vous contacte pour confirmer le paiement et la livraison.',
    shopNow: 'Acheter', productsListed: 'Produits listes', itemsInStock: 'Articles en stock', freeShippingFrom: 'Livraison gratuite des',
    fastDeliveryTitle: 'Livraison rapide au Cameroun', fastDeliveryDesc: 'Options de livraison pour Bamenda, Buea, Douala, Yaounde et plus.',
    paymentTitle: 'Confirmation manuelle du paiement', paymentDesc: 'Passez votre commande et la boutique vous contacte avant le paiement et la livraison.',
    supportTitle: 'Assistance reelle', supportDesc: 'Appelez {phone} pour le suivi des commandes et les questions produits.',
    featured: 'En vedette', featuredTitle: 'Produits a mettre en avant', viewAll: 'Tout voir',
    noProductsYet: 'Aucun produit pour le moment', ownerCanAdd: 'Le proprietaire peut ajouter des produits reels depuis le tableau de bord admin.',
    showingProducts: '{shown} produit(s) affiche(s) sur {total}', searchProducts: 'Rechercher des produits', filters: 'Filtres',
    activeFilters: '{count} filtre{plural} actif{plural}', category: 'Categorie', priceRange: 'Fourchette de prix', minXaf: 'Min XAF',
    maxXaf: 'Max XAF', inStockOnly: 'Afficher seulement les produits en stock', newest: 'Plus recents', priceLow: 'Prix: croissant',
    priceHigh: 'Prix: decroissant', mostPopular: 'Plus populaires', inStockFirst: 'En stock d abord',
    noProductsFound: 'Aucun produit trouve', changeFilters: 'Essayez une autre recherche ou effacez les filtres.',
    productNotFound: 'Produit introuvable', description: 'Description', noDescription: 'Aucune description pour le moment.',
    availableOnly: 'Disponible seulement a: {regions}', variant: 'Variante', option: 'Option', related: 'Produits similaires',
    noRelated: 'Aucun produit similaire pour le moment.', emptyWishlist: 'Votre liste de favoris est vide',
    saveProducts: 'Enregistrez les produits que vous voulez revoir plus tard.', savedItems: '{count} article{plural} enregistre{plural}',
    addAllStock: 'Ajouter tous les produits en stock au panier', footerTagline: 'Electronique et accessoires premium au Cameroun.',
    rights: 'Tous droits reserves.', language: 'Langue'
  }
}

const categoryTranslations = {
  fr: {
    Phones: 'Telephones',
    Computers: 'Ordinateurs',
    Audio: 'Audio',
    Televisions: 'Televisions',
    Accessories: 'Accessoires',
    'Computer Accessories': 'Accessoires informatiques',
    Electronics: 'Electronique'
  }
}

function interpolate(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '')
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('language') || 'en')

  const value = useMemo(() => {
    const t = (key, values) => interpolate(dictionaries[language]?.[key] || dictionaries.en[key] || key, values)
    const setLanguage = (nextLanguage) => {
      const safeLanguage = dictionaries[nextLanguage] ? nextLanguage : 'en'
      localStorage.setItem('language', safeLanguage)
      setLanguageState(safeLanguage)
    }
    const translateProduct = (product = {}) => {
      const translated = product.translations?.[language] || {}
      return {
        ...product,
        displayName: translated.name || product.name,
        displayDescription: translated.description || product.description,
        displayCategory: translated.category || categoryTranslations[language]?.[product.category] || product.category
      }
    }
    return {
      language,
      setLanguage,
      t,
      translateProduct,
      languages: [{ code: 'en', label: 'English' }, { code: 'fr', label: 'Francais' }]
    }
  }, [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
