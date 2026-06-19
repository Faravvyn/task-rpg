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
<<<<<<< HEAD
        start_url: '/',
=======
        start_url: '.',
        scope: '/',
>>>>>>> e9af9165ee8e83e424ea7e9a2b22cb7acfecd7f2
        icons: [
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
<<<<<<< HEAD
            purpose: 'any maskable'
=======
            purpose: 'any'
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
>>>>>>> e9af9165ee8e83e424ea7e9a2b22cb7acfecd7f2
          }
        ]
      },
      workbox: {
<<<<<<< HEAD
        // Explicitly only cache essential assets to avoid conflicts
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        navigateFallback: '/index.html'
=======
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true
>>>>>>> e9af9165ee8e83e424ea7e9a2b22cb7acfecd7f2
      }
    })
  ],
  server: { port: 5173 }
})
