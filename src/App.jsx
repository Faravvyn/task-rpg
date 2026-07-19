import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import React, { lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy Loading für Seiten
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const CharacterPage = lazy(() => import('./pages/CharacterPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const FriendsPage = lazy(() => import('./pages/FriendsPage'))
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const AdventurePage = lazy(() => import('./pages/AdventurePage'))
const InventoryPage = lazy(() => import('./pages/InventoryPage'))
const BossPage = lazy(() => import('./pages/BossPage'))
const KodexPage = lazy(() => import('./pages/KodexPage'))
const ForgePage = lazy(() => import('./pages/ForgePage'))
const ArenaPage = lazy(() => import('./pages/ArenaPage'))
const QuestsPage = lazy(() => import('./pages/QuestsPage'))
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'))
const LoadoutPage = lazy(() => import('./pages/LoadoutPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const MonsterPage = lazy(() => import('./pages/MonsterPage'))
const RPGPage = lazy(() => import('./pages/RPGPage'))

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-dark-500 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">⚔️</div>
        <p className="text-gold-400 font-title text-xl">TaskRPG lädt...</p>
      </div>
    </div>
  )
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="character" element={<CharacterPage />} />
          <Route path="rpg" element={<RPGPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="challenges" element={<ChallengesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="adventure" element={<AdventurePage />} />
          <Route path="adventure/inventory" element={<InventoryPage />} />
          <Route path="adventure/boss" element={<BossPage />} />
          <Route path="adventure/kodex" element={<KodexPage />} />
          <Route path="adventure/forge" element={<ForgePage />} />
          <Route path="adventure/arena" element={<ArenaPage />} />
          <Route path="adventure/quests" element={<QuestsPage />} />
          <Route path="adventure/loadout" element={<LoadoutPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="monsters" element={<MonsterPage />} />
        </Route>
        <Route path="/invite/:username" element={<InviteRedirect />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
function InviteRedirect() {
  const { username } = useParams()
  return <Navigate to={`/friends?add=${username}`} replace />
}
