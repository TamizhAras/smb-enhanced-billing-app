/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register'

export const registerServiceWorker = () => {
  const updateSW = registerSW({
    onNeedRefresh() {
      if (window.confirm('New content available. Reload to update?')) {
        updateSW(true)
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline')
      // Optional: Show a toast notification
      showOfflineReadyMessage()
    },
    onRegisterError(error: any) {
      console.error('SW registration error', error)
    },
  })
}

function showOfflineReadyMessage() {
  // Create a simple toast notification
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #10b981;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    animation: slideUp 0.3s ease-out;
  `
  
  toast.textContent = '✅ App is ready to work offline!'
  document.body.appendChild(toast)
  
  // Add slide up animation
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideUp {
      from { transform: translateX(-50%) translateY(100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
  `
  document.head.appendChild(style)
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease-out reverse'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

export const isOnline = () => navigator.onLine
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
