import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: false,
      selfDestroying: true,
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
