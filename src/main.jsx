// Datei: src/main.jsx – Provider-Reihenfolge:
// Auth → Adventure → Game → Achievement → Notification
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { GameProvider } from './context/GameContext'
import { AdventureProvider } from './context/AdventureContext'
import { AchievementProvider } from './context/AchievementContext'
import { NotificationProvider } from './context/NotificationContext'
import './index.css'
import { useRegisterSW } from 'virtual:pwa-register/react'

function Root() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) { console.log('PWA Service Worker registriert.'); },
    onRegisterError(error) { console.error('PWA SW Fehler:', error); },
  })

  const closeUpdate = () => setNeedRefresh(false);

  return (
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <AdventureProvider>
            <GameProvider>
              <AchievementProvider>
                <NotificationProvider>
                  <App />
                  {/* PWA Update Prompt */}
                  {needRefresh && (
                    <div className="fixed bottom-20 left-4 right-4 z-[100] bg-gold-500 text-dark-600 p-4 rounded-xl shadow-2xl flex items-center justify-between animate-slide-up border-2 border-white/20">
                      <div className="flex-1 pr-4 text-left">
                        <p className="font-bold text-sm">Update verfügbar! ✨</p>
                        <p className="text-[10px]">Lade die neueste Version für alle Features.</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateServiceWorker(true)} className="bg-dark-600 text-white text-xs px-3 py-2 rounded-lg font-bold">Laden</button>
                        <button onClick={closeUpdate} className="text-dark-600/60 text-xs px-1">Später</button>
                      </div>
                    </div>
                  )}
                </NotificationProvider>
              </AchievementProvider>
            </GameProvider>
          </AdventureProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
