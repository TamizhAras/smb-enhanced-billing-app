import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializePhase3MockData } from './lib/mockDataPhase3'
import { registerServiceWorker } from './registerSW'

// Initialize Phase 3 mock data
initializePhase3MockData();

// Register Service Worker for PWA functionality
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
