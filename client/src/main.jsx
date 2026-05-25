import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </LanguageProvider>
)

