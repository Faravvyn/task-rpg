import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      manifest: {
        name: 'TaskRPG - Queste dein Leben',
        short_name: 'TaskRPG',
        description: 'Alltagsaufgaben mit RPG-Gamification.',
        theme_color: '#10121A',
        background_color: '#10121A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Explicitly only cache essential assets to avoid conflicts
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        navigateFallback: '/index.html'
      }
    })
  ],
  server: { port: 5173 }
})
