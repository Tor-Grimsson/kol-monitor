import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Re-stamp a saved theme choice before first paint (the DS useTheme also does
// this on mount, but not every route mounts a theme consumer).
import { applyTheme, THEME_STORAGE_KEY } from '@kolkrabbi/kol-framework/src/theme.js'

try {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') applyTheme(saved)
} catch { /* storage blocked — system theme applies */ }

// Dev-only favicon: a big MO so dev tabs read apart from prod at a glance.
if (import.meta.env.DEV) {
  const link = document.querySelector('link[rel="icon"]')
  if (link) {
    link.href = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" fill="#CE4646"/>' +
      '<text x="16" y="29" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF">M</text>' +
      '</svg>'
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
