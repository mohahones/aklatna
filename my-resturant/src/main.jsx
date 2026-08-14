import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      const swUrl = new URL('sw.js', document.baseURI).href;
      navigator.serviceWorker.register(swUrl).then(reg => {
        console.log('Service worker registered:', reg.scope);
      }).catch(err => console.warn('SW register failed:', err));
    } catch (e) {
      console.warn('SW register error building URL:', e);
    }
  });
}
