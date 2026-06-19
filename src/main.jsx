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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AdventureProvider>
          <GameProvider>
            <AchievementProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </AchievementProvider>
          </GameProvider>
        </AdventureProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)