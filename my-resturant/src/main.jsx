import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const redirectPath = window.sessionStorage.getItem('gh-pages-redirect')

if (redirectPath) {
  window.sessionStorage.removeItem('gh-pages-redirect')
  window.history.replaceState(null, '', redirectPath)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
