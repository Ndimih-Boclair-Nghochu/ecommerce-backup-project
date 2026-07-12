import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import ProductCard from '../components/ProductCard'
import { formatXAF } from '../utils/format'
import { useLanguage } from '../i18n/LanguageContext'

const Locations = lazy(() => import('../components/Locations'))

const INITIAL_HERO_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920'

const SERVICES = [
  {
    icon: '🔍',
    title: 'Research & Groundwater',
    desc: 'Borehole siting, hydrogeological surveys, pumping tests, water quality analysis, GIS mapping and project feasibility studies.',
    color: 'blue',
    img: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80'
  },
  {
    icon: '🏗️',
    title: 'Water Storage',
    desc: 'Overhead & ground storage tanks (concrete, plastic, steel, fiberglass), water towers, plumbing, tank cleaning and maintenance.',
    color: 'green',
    img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80'
  },
  {
    icon: '⛏️',
    title: 'Well Drilling',
    desc: 'Borehole drilling (manual, rotary, DTH), casing & screen installation, handpump & submersible pump installation, borehole rehabilitation.',
    color: 'amber',
    img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80'
  },
  {
    icon: '🔧',
    title: 'Welding & Fabrication',
    desc: 'Structural steel works, pipe fitting, custom metal works including gates, tanks, towers, frames, and mobile welding services.',
    color: 'blue',
    img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80'
  },
  {
    icon: '☀️',
    title: 'Solar Energy',
    desc: 'Solar water pump installation (AC/DC/Hybrid), solar power systems for homes, farms & institutions, inverter & battery installation.',
    color: 'green',
    img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80'
  },
  {
    icon: '🚿',
    title: 'General Water Works',
    desc: 'Plumbing, sanitary works, rainwater harvesting, civil works, maintenance contracts. We also train & build skills (practical & theoretical).',
    color: 'amber',
    img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&q=80'
  },
  {
    icon: '📚',
    title: 'Skills Training',
    desc: 'Hands-on practical & theoretical training for the local private sector — building durable skills for profit-based, sustainable livelihoods.',
    color: 'blue',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'
  }
]

const PARTNERS = [
  { name: 'SMART Centre Group', country: 'Netherlands', desc: 'Coordinated by MetaMeta as a social enterprise', url: 'https://smartcentregroup.com' },
  { name: 'EMAS', country: 'Bolivia / Germany', desc: 'Rope pump & manual drilling technology partner', url: '#' },
  { name: 'TADEH', country: 'Spain', desc: 'WASH technology dissemination partner', url: '#' },
  { name: 'MetaMeta', country: 'Netherlands', desc: 'Franchise coordinator and SCG lead organisation', url: '#' }
]

const WHY_SMART = [
  { letter: 'S', word: 'Simple', desc: 'Technologies that anyone can understand, use and maintain without complex training.' },
  { letter: 'M', word: 'Marketable', desc: 'Market-based solutions that create sustainable businesses and livelihoods locally.' },
  { letter: 'A', word: 'Affordable', desc: 'Solutions within reach of families at all income levels, including lower-income households.' },
  { letter: 'R', word: 'Repairable', desc: 'Locally repairable with locally sourced parts — no long-distance supply chains needed.' },
  { letter: 'T', word: 'Technologies', desc: 'Proven, tested technologies for WASH, agriculture, waste management and food science.' }
]

const HERO_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920',
    caption: 'Clean Water for Every Community'
  },
  {
    img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920',
    caption: 'Solar Energy Across Cameroon'
  },
  {
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
    caption: 'Empowering Local Technicians'
  }
]

function PRODUCTS_PER_ROW_BY_WIDTH_fn() {
  if (typeof window === 'undefined') return 4
  if (window.innerWidth >= 1280) return 4
  if (window.innerWidth >= 768) return 3
  return 2
}

// Animated hero slideshow
function HeroSlideshow() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: current === i ? 1 : 0 }}
        >
          <img
            src={slide.img}
            alt=""
            className="h-full w-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,87,168,0.85) 0%, rgba(0,61,122,0.75) 100%)' }} />
        </div>
      ))}
    </div>
  )
}

// Floating animated water drop
function WaterDrop({ delay = 0, x = 50 }) {
  return (
    <div
      className="absolute pointer-events-none opacity-20"
      style={{
        left: `${x}%`,
        top: '-10px',
        animation: `dropFall 8s ${delay}s infinite linear`
      }}
    >
      <svg width="8" height="12" viewBox="0 0 8 12" fill="white">
        <path d="M4 0 C4 0 0 6 0 8.5 C0 10.4 1.8 12 4 12 C6.2 12 8 10.4 8 8.5 C8 6 4 0 4 0Z"/>
      </svg>
    </div>
  )
}

export default function Home({ products, settings, addToCart, toggleWishlist, isInWishlist, loading }) {
  const { t } = useLanguage()
  const [hero, setHero] = useState(null)
  const [stats, setStats] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [productPage, setProductPage] = useState(0)
  const [productColumns, setProductColumns] = useState(PRODUCTS_PER_ROW_BY_WIDTH_fn)
  const [locationsReady, setLocationsReady] = useState(false)
  const [activeService, setActiveService] = useState(null)
  const [countersVisible, setCountersVisible] = useState(false)
  const statsRef = React.useRef(null)
  const servicesScrollRef = React.useRef(null)

  const scrollServices = (dir) => {
    const el = servicesScrollRef.current
    if (!el) return
    const amount = Math.max(el.clientWidth * 0.85, 300)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  useEffect(() => {
    let active = true
    Promise.all([axios.get('/api/hero-section'), axios.get('/api/stats')])
      .then(([heroRes, statsRes]) => {
        if (!active) return
        setHero(heroRes.data)
        setStats(statsRes.data)
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    const onResize = () => setProductColumns(PRODUCTS_PER_ROW_BY_WIDTH_fn())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const showLocations = () => setLocationsReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(showLocations, { timeout: 5000 })
      return () => window.cancelIdleCallback?.(id)
    }
    const timer = window.setTimeout(showLocations, 3500)
    return () => window.clearTimeout(timer)
  }, [])

  // Counter animation observer
  useEffect(() => {
    if (!statsRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCountersVisible(true) },
      { threshold: 0.3 }
    )
    observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  const orderedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aScore = Number(Boolean(a.mostOrdered)) * 2 + Number(Boolean(a.isNew))
      const bScore = Number(Boolean(b.mostOrdered)) * 2 + Number(Boolean(b.isNew))
      if (bScore !== aScore) return bScore - aScore
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [products])

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products])

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    return orderedProducts
      .filter(p => selectedCategory === 'All' ? true : p.category === selectedCategory)
      .filter(p => {
        if (!query) return true
        return `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase().includes(query)
      })
  }, [orderedProducts, productSearch, selectedCategory])

  const productsPerPage = productColumns * 3
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage))
  const visibleProducts = filteredProducts.slice(productPage * productsPerPage, (productPage + 1) * productsPerPage)

  useEffect(() => { setProductPage(0) }, [productSearch, selectedCategory, productsPerPage])
  useEffect(() => { if (productPage >= pageCount) setProductPage(pageCount - 1) }, [pageCount, productPage])

  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-700', text: 'text-blue-700', gradient: 'linear-gradient(135deg, #0057a8 0%, #003d7a 100%)', accent: '#0057a8' },
    green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'bg-green-100 text-green-700', text: 'text-green-700', gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', accent: '#16a34a' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700', text: 'text-amber-700', gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', accent: '#d97706' }
  }

  return (
    <main>
      <style>{`
        @keyframes dropFall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-fadeup { animation: fadeUp 0.7s ease both; }
        .animate-fadeup-delay-1 { animation: fadeUp 0.7s 0.15s ease both; }
        .animate-fadeup-delay-2 { animation: fadeUp 0.7s 0.3s ease both; }
        .animate-fadeup-delay-3 { animation: fadeUp 0.7s 0.45s ease both; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .service-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,87,168,0.12); }
        .service-card { transition: transform 0.25s, box-shadow 0.25s; }
        .service-card:hover .service-card-img { transform: scale(1.06); }
        .service-card-img { transition: transform 0.4s ease; }
        .services-rail { scrollbar-width: thin; scrollbar-color: #0057a8 #e2e8f0; scroll-padding-left: 1rem; }
        .services-rail::-webkit-scrollbar { height: 8px; }
        .services-rail::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 999px; }
        .services-rail::-webkit-scrollbar-thumb { background: #0057a8; border-radius: 999px; }
        .services-rail::-webkit-scrollbar-thumb:hover { background: #003d7a; }
        .services-nav-btn:hover { background: #0057a8 !important; }
        .partner-card:hover { border-color: #0057a8; }
        .partner-card { transition: border-color 0.2s; }
        .smart-letter { transition: transform 0.2s, background 0.2s; }
        .smart-letter:hover { transform: scale(1.08); }
        .counter-num { font-variant-numeric: tabular-nums; }
        .product-grid-enter { animation: fadeUp 0.4s ease; }
      `}</style>

      {/* Decorative drops */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {[10, 25, 40, 60, 75, 90].map((x, i) => (
          <WaterDrop key={i} x={x} delay={i * 1.3} />
        ))}
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        <HeroSlideshow />

        <div className="relative z-10 w-full py-20 px-4 text-white text-center">
          {/* SCC Badge */}
          <div className="animate-fadeup inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold mb-6" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Franchise of SMART Centre Group · Netherlands
          </div>

          {/* Headline */}
          <div className="animate-fadeup-delay-1">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
              SMART Centre Cameroon
            </h1>

            <p className="mx-auto max-w-3xl text-lg md:text-xl leading-relaxed opacity-90 mb-4">
              <span className="font-bold text-green-300">Simple · Marketable · Repairable Technologies</span>
            </p>
            <p className="mx-auto max-w-2xl text-base md:text-lg leading-relaxed opacity-80 mb-10">
              Empowering communities across Cameroon with self-supply WASH solutions — from borehole drilling and water storage to solar energy and sanitation.
            </p>
          </div>

          <div className="animate-fadeup-delay-2 flex flex-wrap justify-center gap-4">
            <Link to="/products" className="rounded-xl px-8 py-4 font-bold text-white text-base shadow-xl transition hover:scale-105" style={{ background: '#16a34a' }}>
              🛒 Shop Our Products & Services
            </Link>
            <a href="#services" className="rounded-xl border-2 border-white px-8 py-4 font-bold text-white text-base transition hover:bg-white/10">
              🔍 Explore Services
            </a>
          </div>

          {/* Quick stats bar */}
          <div className="animate-fadeup-delay-3 mx-auto mt-14 max-w-3xl grid grid-cols-3 gap-3">
            {[
              { value: '10+', label: 'Years in Cameroon' },
              { value: '9', label: 'African SC Countries' },
              { value: '100%', label: 'Cameroon Coverage' }
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="text-2xl md:text-3xl font-black counter-num">{s.value}</div>
                <div className="text-xs md:text-sm opacity-80 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-60 animate-bounce">
          <svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/><path d="M7 10l5 5 5-5" stroke="white" strokeWidth="2" fill="none"/></svg>
        </div>
      </section>

      {/* ── WHAT IS SMART ── */}
      <section id="about" className="py-16 px-4" style={{ background: 'white' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-black uppercase tracking-widest mb-3 px-3 py-1 rounded-full" style={{ color: '#0057a8', background: '#e8f0fb' }}>Our Mission</span>
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>
              What is <span style={{ color: '#0057a8' }}>SMART</span>?
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600 leading-relaxed">
              SMART Centre Cameroon Ltd operates a franchise model with SMART Centre Group (coordinated by MetaMeta, Netherlands) — bringing proven WASH technologies across Cameroon and future Central Africa.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-12">
            {WHY_SMART.map((item) => (
              <div key={item.letter} className="smart-letter rounded-2xl p-5 text-center cursor-default" style={{ background: '#e8f0fb', border: '2px solid #bfdbfe' }}>
                <div className="text-4xl font-black mb-2" style={{ color: '#0057a8', fontFamily: "'Sora', sans-serif" }}>{item.letter}</div>
                <div className="font-bold text-sm mb-2" style={{ color: '#0057a8' }}>{item.word}</div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-6 md:p-10" style={{ background: 'linear-gradient(135deg, #0057a8 0%, #003d7a 100%)', color: 'white' }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-black mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>Our Strategic Vision</h3>
                <ul className="space-y-3 text-sm leading-relaxed opacity-90">
                  {[
                    'Promote technologies/services that are Simple, Market-based, Affordable and Repairable',
                    'Focus on training the local private sector for "profit-based sustainability"',
                    'Promote self-supply, family-level technologies for lower-income families',
                    'Promote HWTS (Household Water Treatment and Safe Storage) with household water filters',
                    'Assist local private sector in establishing affordable WASH supply chains'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-xs font-black" style={{ background: '#16a34a' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">💧</div>
                <p className="text-xl font-bold mb-2">WASH Focus</p>
                <p className="opacity-80 text-sm">Water · Sanitation · Hygiene</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { icon: '🌾', label: 'Agriculture' },
                    { icon: '♻️', label: 'Waste Mgmt' },
                    { icon: '🥗', label: 'Food Science' },
                    { icon: '🌍', label: 'Central Africa' }
                  ].map(i => (
                    <div key={i.label} className="rounded-xl py-3 px-2 text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.12)' }}>
                      <div className="text-2xl mb-1">{i.icon}</div>
                      {i.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-16 px-4" style={{ background: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div className="text-center md:text-left">
              <span className="inline-block text-xs font-black uppercase tracking-widest mb-3 px-3 py-1 rounded-full" style={{ color: '#16a34a', background: '#dcfce7' }}>Services &amp; Training</span>
              <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>
                What We <span style={{ color: '#0057a8' }}>Offer</span>
              </h2>
              <p className="max-w-xl mx-auto md:mx-0 text-gray-600">
                Serving NGOs, Government, Contractors &amp; Individuals — quality service, integrity and commitment across Cameroon. Swipe to explore.
              </p>
            </div>
            {/* Scroll controls (desktop) */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => scrollServices('left')}
                aria-label="Scroll services left"
                className="services-nav-btn h-11 w-11 rounded-full border-2 flex items-center justify-center bg-white transition hover:text-white"
                style={{ borderColor: '#0057a8', color: '#0057a8' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button
                type="button"
                onClick={() => scrollServices('right')}
                aria-label="Scroll services right"
                className="services-nav-btn h-11 w-11 rounded-full border-2 flex items-center justify-center bg-white transition hover:text-white"
                style={{ borderColor: '#0057a8', color: '#0057a8' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          {/* Horizontal scroll rail */}
          <div ref={servicesScrollRef} className="services-rail flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {SERVICES.map((service, i) => {
              const c = colorMap[service.color]
              return (
                <article
                  key={i}
                  className="service-card snap-start shrink-0 w-[80vw] sm:w-[340px] max-w-[360px] rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm flex flex-col"
                  onMouseEnter={() => setActiveService(i)}
                  onMouseLeave={() => setActiveService(null)}
                >
                  {/* Image header with gradient fallback */}
                  <div className="relative h-44 w-full overflow-hidden" style={{ background: c.gradient }}>
                    <img
                      src={service.img}
                      alt={service.title}
                      loading="lazy"
                      className="service-card-img h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0) 35%, rgba(15,23,42,0.55) 100%)' }} />
                    <div className="absolute top-3 left-3 h-11 w-11 rounded-xl flex items-center justify-center text-2xl shadow-md" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)' }}>
                      {service.icon}
                    </div>
                    <h3 className="absolute bottom-3 left-4 right-4 text-lg font-black text-white drop-shadow" style={{ fontFamily: "'Sora', sans-serif" }}>{service.title}</h3>
                  </div>
                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-sm leading-relaxed text-gray-600 flex-1">{service.desc}</p>
                    <a
                      href="https://www.smartcentrecameroon.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${c.text} hover:gap-2 transition-all`}
                    >
                      Learn More →
                    </a>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 italic mb-4">"Quality Service, Integrity, Commitment – At SMART Centre Cameroon"</p>
            <Link to="/products" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold text-white transition hover:scale-105" style={{ background: '#0057a8' }}>
              View All Products &amp; Services →
            </Link>
          </div>
        </div>
      </section>

      {/* ── IMPACT STATS ── */}
      <section ref={statsRef} className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #0057a8 0%, #003d7a 100%)', color: 'white' }}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-10" style={{ fontFamily: "'Sora', sans-serif" }}>Our Reach Across Cameroon</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '6', suffix: '+', label: 'Service Areas', icon: '🗺️' },
              { value: '100', suffix: '%', label: 'Country Coverage', icon: '🌍' },
              { value: products.length || '50', suffix: '+', label: 'Products Listed', icon: '📦' },
              { value: '24', suffix: '/7', label: 'Support Available', icon: '📞' }
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-black counter-num">{stat.value}{stat.suffix}</div>
                <div className="text-sm opacity-80 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS SECTION ── */}
      <section className="py-16 px-4" style={{ background: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-block text-xs font-black uppercase tracking-widest mb-3 px-3 py-1 rounded-full" style={{ color: '#0057a8', background: '#e8f0fb' }}>Shop</span>
              <h2 className="text-3xl font-black mb-2" style={{ fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>Products & Equipment</h2>
              <p className="text-gray-600 text-sm max-w-xl">Browse our catalog of water, sanitation, solar and construction products. Order online and our team will contact you to confirm.</p>
            </div>
            <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:grid-cols-[minmax(200px,1fr)_180px_auto] lg:min-w-[580px]">
              <input
                type="search"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>
                ))}
              </select>
              <Link to="/products" className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                View All
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: productsPerPage }).map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-white border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 product-grid-enter">
                {visibleProducts.map(product => (
                  <ProductCard key={product.id} product={product} addToCart={addToCart} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} />
                ))}
              </div>
              <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row">
                <p className="text-sm font-semibold text-gray-500">
                  Showing {visibleProducts.length} of {filteredProducts.length} products · Page {productPage + 1} of {pageCount}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setProductPage(p => Math.max(0, p - 1))} disabled={productPage === 0}
                    className="h-10 w-10 rounded-full border border-gray-200 font-bold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    ←
                  </button>
                  <button onClick={() => setProductPage(p => Math.min(pageCount - 1, p + 1))} disabled={productPage >= pageCount - 1}
                    className="h-10 w-10 rounded-full font-bold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: '#0057a8' }}>
                    →
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{products.length ? 'No products found' : 'Products coming soon'}</h3>
              <p className="text-gray-500">{products.length ? 'Try a different search or category.' : 'Our catalog is being set up. Check back soon!'}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-black uppercase tracking-widest mb-3 px-3 py-1 rounded-full" style={{ color: '#d97706', background: '#fef3c7' }}>Network</span>
            <h2 className="text-3xl font-black mb-3" style={{ fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>Our International Partners</h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm">
              SMART Centre Cameroon is part of a global franchise network of SMART centres spanning Africa, Latin America and Europe.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PARTNERS.map((p, i) => (
              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                className="partner-card block rounded-2xl border-2 border-gray-200 p-5 text-center no-underline">
                <div className="text-2xl mb-3">🤝</div>
                <div className="font-black text-sm mb-1" style={{ color: '#0057a8' }}>{p.name}</div>
                <div className="text-xs font-semibold text-gray-500 mb-2">{p.country}</div>
                <p className="text-xs text-gray-600 leading-relaxed">{p.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-16 px-4" style={{ background: '#f8fafc' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-black uppercase tracking-widest mb-3 px-3 py-1 rounded-full" style={{ color: '#0057a8', background: '#e8f0fb' }}>Why SCC</span>
            <h2 className="text-3xl font-black" style={{ fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>The SCC Advantage</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: '🏭', title: 'Nationwide Operations', desc: 'Regional representatives across all of Cameroon, with future plans for Central Africa expansion.' },
              { icon: '📚', title: 'Skills Training', desc: 'We train and build practical & theoretical skills in the local private sector for sustainable growth.' },
              { icon: '💰', title: 'Affordable Solutions', desc: 'Market-based, self-supply technologies accessible even to lower-income families and communities.' }
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border-2 border-gray-100 bg-white p-6 text-center service-card">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-black text-base mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-4xl mb-4">💧</div>
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
            Ready for Clean, Reliable Water?
          </h2>
          <p className="opacity-90 mb-8 text-lg">
            Contact SMART Centre Cameroon today. We'll assess your needs and deliver the right SMART technology for your home, farm, or institution.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/products" className="rounded-xl px-8 py-4 font-bold bg-white transition hover:scale-105" style={{ color: '#16a34a' }}>
              Shop Now
            </Link>
            <Link to="/track-order" className="rounded-xl border-2 border-white px-8 py-4 font-bold text-white transition hover:bg-white/10">
              Track Your Order
            </Link>
          </div>
        </div>
      </section>

      {locationsReady && (
        <Suspense fallback={null}>
          <Locations />
        </Suspense>
      )}
    </main>
  )
}
