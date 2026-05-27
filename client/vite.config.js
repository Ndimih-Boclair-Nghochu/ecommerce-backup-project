import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Cache strategy: stale-while-revalidate for API calls, cache-first for assets
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/products$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-products',
              expiration: { maxEntries: 1, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/settings$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-settings',
              expiration: { maxEntries: 1, maxAgeSeconds: 600 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/hero-section$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-hero',
              expiration: { maxEntries: 1, maxAgeSeconds: 600 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/categories$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-categories',
              expiration: { maxEntries: 1, maxAgeSeconds: 600 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https?:\/\/.*\/uploads\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: 'MyShop',
        short_name: 'MyShop',
        description: 'Premium Electronics & Accessories in Cameroon',
        theme_color: '#1d4ed8',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/favicon.ico', sizes: '64x64', type: 'image/x-icon' }
        ]
      }
    })
  ],
  build: {
    // Code splitting: each route/admin component in its own chunk
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts (large, admin-only)
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          // PDF tools (large, admin-only)
          'vendor-pdf': ['jspdf', 'html2canvas', 'html2pdf.js'],
        }
      }
    },
    // Better minification
    minify: 'esbuild',
    // Sourcemaps off in production (smaller bundle)
    sourcemap: false,
    // Chunk size warning at 600kb
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:4000',
      '/uploads': 'http://127.0.0.1:4000'
    }
  }
})
