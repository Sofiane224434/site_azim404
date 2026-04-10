import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const FAVICON_URL = '/favicon.ico?v=4'

function applyFavicon() {
  let icon = document.querySelector('link[rel="icon"]')

  if (!icon) {
    icon = document.createElement('link')
    icon.setAttribute('rel', 'icon')
    document.head.appendChild(icon)
  }

  icon.setAttribute('type', 'image/x-icon')
  icon.setAttribute('href', FAVICON_URL)
}

applyFavicon()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
