/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:pwa-register' {
  export function registerSW(options?: {
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegisterError?: (error: any) => void
  }): (reloadPage?: boolean) => Promise<void>
}
