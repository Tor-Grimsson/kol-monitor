import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { hideLoaderApp } from '@kolkrabbi/kol-framework/src/loaderApp.js'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
hideLoaderApp()
