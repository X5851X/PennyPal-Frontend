import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    cors: true,
    proxy: {
      '/auth': {
        target: 'https://pennypal-backend.ddns.net',
        changeOrigin: true,
        secure: true
      },
      '/transaction': {
        target: 'https://pennypal-backend.ddns.net',
        changeOrigin: true,
        secure: true
      },
      '/currency': {
        target: 'https://pennypal-backend.ddns.net',
        changeOrigin: true,
        secure: true
      },
      '/health': {
        target: 'https://pennypal-backend.ddns.net',
        changeOrigin: true,
        secure: true
      },
      '/ai': {
        target: 'https://pennypal-backend.ddns.net',
        changeOrigin: true,
        secure: true
      },
      '/ocr': {
        target: 'https://pennypal-backend.ddns.net',
        changeOrigin: true,
        secure: true
      }
    }
  },
  define: {
    global: 'globalThis',
  }
})
