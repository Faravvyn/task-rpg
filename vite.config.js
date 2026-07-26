import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Update-Aufforderung statt automatischer Versuch
      injectRegister: 'auto',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // Wichtig: Neue Version sofort aktivieren und alle Clients übernehmen
        skipWaiting: true,
        clientsClaim: true,
        // Netzwerk-zuerst für HTML, Cache für Assets
        runtimeCaching: [
          {
            urlPattern: /\/$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /\.(js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'asset-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('lucide')) return 'vendor-icons';
            if (id.includes('supabase')) return 'vendor-supabase';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800
  },
  server: { port: 5173 }
})
