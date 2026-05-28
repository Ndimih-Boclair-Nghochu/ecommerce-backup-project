import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import './index.css'

const rootElement = document.getElementById('root')

createRoot(rootElement).render(
  <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </LanguageProvider>
)

requestAnimationFrame(() => window.__hideAppShell?.())

