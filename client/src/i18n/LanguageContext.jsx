import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'

const LanguageContext = createContext(null)

export const dictionaries = {
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
    footerTagline: 'Simple, Affordable, Repairable Technologies for Water, Sanitation & Sustainable Livelihoods across Cameroon.', rights: 'All Rights Reserved.', language: 'Language',
    homeShopCta: 'Shop Our Products',
    servicesChip: 'Services & Training', whatWe: 'What We', offer: 'Offer',
    servicesIntro: 'Serving NGOs, Government, Contractors & Individuals — quality service, integrity and commitment across Cameroon. Swipe to explore.',
    learnMore: 'Learn More',
    servicesQuote: '"Quality Service, Integrity, Commitment – At SMART Centre Cameroon"',
    viewAllProductsServices: 'View All Products & Services',
    svcResearchTitle: 'Research & Groundwater',
    svcResearchDesc: 'Borehole siting, hydrogeological surveys, pumping tests, water quality analysis, GIS mapping and project feasibility studies.',
    svcStorageTitle: 'Water Storage',
    svcStorageDesc: 'Overhead & ground storage tanks (concrete, plastic, steel, fiberglass), water towers, plumbing, tank cleaning and maintenance.',
    svcDrillingTitle: 'Well Drilling',
    svcDrillingDesc: 'Borehole drilling (manual, rotary, DTH), casing & screen installation, handpump & submersible pump installation, borehole rehabilitation.',
    svcWeldingTitle: 'Welding & Fabrication',
    svcWeldingDesc: 'Structural steel works, pipe fitting, custom metal works including gates, tanks, towers, frames, and mobile welding services.',
    svcSolarTitle: 'Solar Energy',
    svcSolarDesc: 'Solar water pump installation (AC/DC/Hybrid), solar power systems for homes, farms & institutions, inverter & battery installation.',
    svcWaterworksTitle: 'General Water Works',
    svcWaterworksDesc: 'Plumbing, sanitary works, rainwater harvesting, civil works, maintenance contracts. We also train & build skills (practical & theoretical).',
    svcTrainingTitle: 'Skills Training',
    svcTrainingDesc: 'Hands-on practical & theoretical training for the local private sector — building durable skills for profit-based, sustainable livelihoods.',
    reachTitle: 'Our Reach Across Cameroon',
    statServiceAreas: 'Service Areas', statCountryCoverage: 'Country Coverage', statProductsListed: 'Products Listed', statSupport: 'Support Available',
    shopChip: 'Shop', productsEquipment: 'Products & Equipment',
    productsIntro: 'Browse our catalog of water, sanitation, solar and construction products. Order online and our team will contact you to confirm.',
    allCategories: 'All categories',
    showingPage: 'Showing {shown} of {total} products · Page {page} of {pages}',
    tryDifferentSearch: 'Try a different search or category.',
    productsComingSoon: 'Products coming soon',
    catalogBeingSetUp: 'Our catalog is being set up. Check back soon!',
    networkChip: 'Network', partnersTitle: 'Our International Partners',
    partnersIntro: 'SMART Centre Cameroon is part of a global franchise network of SMART centres spanning Africa, Latin America and Europe.',
    partnerScgDesc: 'Coordinated by MetaMeta as a social enterprise',
    partnerEmasDesc: 'Rope pump & manual drilling technology partner',
    partnerTadehDesc: 'WASH technology dissemination partner',
    partnerMetametaDesc: 'Franchise coordinator and SCG lead organisation',
    whySccChip: 'Why SCC', sccAdvantage: 'The SCC Advantage',
    advNationwideTitle: 'Nationwide Operations',
    advNationwideDesc: 'Regional representatives across all of Cameroon, with future plans for Central Africa expansion.',
    advTrainingTitle: 'Skills Training',
    advTrainingDesc: 'We train and build practical & theoretical skills in the local private sector for sustainable growth.',
    advAffordableTitle: 'Affordable Solutions',
    advAffordableDesc: 'Market-based, self-supply technologies accessible even to lower-income families and communities.',
    ctaTitle: 'Ready for Clean, Reliable Water?',
    ctaDesc: "Contact SMART Centre Cameroon today. We'll assess your needs and deliver the right SMART technology for your home, farm, or institution.",
    trackYourOrder: 'Track Your Order',
    storeLocationsChip: 'Store locations', visitOurStore: 'Visit Our Store',
    findUsNearYou: 'Find us at convenient locations near you.',
    storeDetailsLoaded: 'Store details loaded', refresh: 'Refresh',
    mainStore: 'Main Store', branchLocations: 'Branch Locations ({count})',
    address: 'Address', phoneLabel: 'Phone', emailLabel: 'Email', hoursLabel: 'Hours',
    openInMaps: 'Open in Google Maps',
    noLocations: 'No store locations available at this time.',
    franchiseOf: 'Franchise of SMART Centre Group · Netherlands',
    servicesHeading: 'Services', quickLinks: 'Quick Links', contactHeading: 'Contact', myAccount: 'My Account',
    footerAddressLine1: 'Cameroon (Nationwide)', footerAddressLine2: 'Regional representatives across all regions',
    servingNgosGov: 'Serving NGOs, Government', contractorsIndividuals: 'Contractors & Individuals worldwide'
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
    addAllStock: 'Ajouter tous les produits en stock au panier',
    footerTagline: 'Des technologies simples, abordables et réparables pour l’eau, l’assainissement et des moyens de subsistance durables au Cameroun.',
    rights: 'Tous droits réservés.', language: 'Langue',
    homeShopCta: 'Achetez nos produits',
    servicesChip: 'Services & Formation', whatWe: 'Ce que nous', offer: 'proposons',
    servicesIntro: 'Au service des ONG, du gouvernement, des entrepreneurs et des particuliers — service de qualité, intégrité et engagement partout au Cameroun. Faites défiler pour explorer.',
    learnMore: 'En savoir plus',
    servicesQuote: '« Service de qualité, intégrité, engagement – chez SMART Centre Cameroun »',
    viewAllProductsServices: 'Voir tous les produits et services',
    svcResearchTitle: 'Recherche & Eaux souterraines',
    svcResearchDesc: 'Implantation de forages, études hydrogéologiques, essais de pompage, analyse de la qualité de l’eau, cartographie SIG et études de faisabilité.',
    svcStorageTitle: 'Stockage d’eau',
    svcStorageDesc: 'Réservoirs surélevés et au sol (béton, plastique, acier, fibre de verre), châteaux d’eau, plomberie, nettoyage et entretien des réservoirs.',
    svcDrillingTitle: 'Forage de puits',
    svcDrillingDesc: 'Forage de puits (manuel, rotatif, DTH), pose de tubages et crépines, installation de pompes manuelles et immergées, réhabilitation de forages.',
    svcWeldingTitle: 'Soudure & Fabrication',
    svcWeldingDesc: 'Charpentes métalliques, tuyauterie, ouvrages métalliques sur mesure (portails, réservoirs, châteaux, cadres) et services de soudure mobile.',
    svcSolarTitle: 'Énergie solaire',
    svcSolarDesc: 'Installation de pompes à eau solaires (AC/DC/hybride), systèmes solaires pour maisons, fermes et institutions, installation d’onduleurs et de batteries.',
    svcWaterworksTitle: 'Travaux hydrauliques généraux',
    svcWaterworksDesc: 'Plomberie, travaux sanitaires, récupération d’eau de pluie, génie civil, contrats d’entretien. Nous formons aussi (pratique et théorie).',
    svcTrainingTitle: 'Formation professionnelle',
    svcTrainingDesc: 'Formation pratique et théorique du secteur privé local — des compétences durables pour des moyens de subsistance rentables et pérennes.',
    reachTitle: 'Notre présence à travers le Cameroun',
    statServiceAreas: 'Zones de service', statCountryCoverage: 'Couverture nationale', statProductsListed: 'Produits listés', statSupport: 'Assistance disponible',
    shopChip: 'Boutique', productsEquipment: 'Produits & Équipements',
    productsIntro: 'Parcourez notre catalogue de produits pour l’eau, l’assainissement, le solaire et la construction. Commandez en ligne et notre équipe vous contactera pour confirmer.',
    allCategories: 'Toutes les catégories',
    showingPage: '{shown} produit(s) affiché(s) sur {total} · Page {page} sur {pages}',
    tryDifferentSearch: 'Essayez une autre recherche ou catégorie.',
    productsComingSoon: 'Produits bientôt disponibles',
    catalogBeingSetUp: 'Notre catalogue est en cours de préparation. Revenez bientôt !',
    networkChip: 'Réseau', partnersTitle: 'Nos partenaires internationaux',
    partnersIntro: 'SMART Centre Cameroun fait partie d’un réseau mondial de franchises de centres SMART présents en Afrique, en Amérique latine et en Europe.',
    partnerScgDesc: 'Coordonné par MetaMeta en tant qu’entreprise sociale',
    partnerEmasDesc: 'Partenaire technologique : pompes à corde et forage manuel',
    partnerTadehDesc: 'Partenaire de diffusion des technologies WASH',
    partnerMetametaDesc: 'Coordinateur de la franchise et organisation principale du SCG',
    whySccChip: 'Pourquoi SCC', sccAdvantage: 'L’avantage SCC',
    advNationwideTitle: 'Opérations nationales',
    advNationwideDesc: 'Des représentants régionaux dans tout le Cameroun, avec des projets d’expansion en Afrique centrale.',
    advTrainingTitle: 'Formation professionnelle',
    advTrainingDesc: 'Nous formons le secteur privé local aux compétences pratiques et théoriques pour une croissance durable.',
    advAffordableTitle: 'Solutions abordables',
    advAffordableDesc: 'Des technologies d’auto-approvisionnement, basées sur le marché, accessibles même aux familles à faibles revenus.',
    ctaTitle: 'Prêt pour une eau propre et fiable ?',
    ctaDesc: 'Contactez SMART Centre Cameroun dès aujourd’hui. Nous évaluerons vos besoins et fournirons la technologie SMART adaptée à votre maison, votre ferme ou votre institution.',
    trackYourOrder: 'Suivre votre commande',
    storeLocationsChip: 'Points de vente', visitOurStore: 'Visitez notre magasin',
    findUsNearYou: 'Trouvez-nous dans des lieux pratiques près de chez vous.',
    storeDetailsLoaded: 'Détails des magasins chargés', refresh: 'Actualiser',
    mainStore: 'Magasin principal', branchLocations: 'Succursales ({count})',
    address: 'Adresse', phoneLabel: 'Téléphone', emailLabel: 'E-mail', hoursLabel: 'Horaires',
    openInMaps: 'Ouvrir dans Google Maps',
    noLocations: 'Aucun point de vente disponible pour le moment.',
    franchiseOf: 'Franchise de SMART Centre Group · Pays-Bas',
    servicesHeading: 'Services', quickLinks: 'Liens rapides', contactHeading: 'Contact', myAccount: 'Mon compte',
    footerAddressLine1: 'Cameroun (tout le pays)', footerAddressLine2: 'Représentants régionaux dans toutes les régions',
    servingNgosGov: 'Au service des ONG et du gouvernement', contractorsIndividuals: 'Entrepreneurs et particuliers dans le monde entier'
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

function readCachedContent() {
  try {
    const stored = localStorage.getItem('siteContentCache')
    const parsed = stored ? JSON.parse(stored) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('language') || 'en')
  // Admin-customisable text overrides: { en: { key: text }, fr: { key: text } }
  const [content, setContent] = useState(readCachedContent)

  useEffect(() => {
    let active = true
    api.get('/api/site-content')
      .then((res) => {
        if (!active) return
        const data = res.data && typeof res.data === 'object' ? res.data : {}
        setContent(data)
        try { localStorage.setItem('siteContentCache', JSON.stringify(data)) } catch {}
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const value = useMemo(() => {
    const t = (key, values) => {
      // Precedence: this language's admin override → this language's built-in text
      // → English override → English built-in → the raw key.
      const base = content?.[language]?.[key]
        || dictionaries[language]?.[key]
        || content?.en?.[key]
        || dictionaries.en[key]
        || key
      return interpolate(base, values)
    }
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
  }, [language, content])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
