import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import CharacterPage from './pages/CharacterPage'
import StatsPage from './pages/StatsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import FriendsPage from './pages/FriendsPage'
import ChallengesPage from './pages/ChallengesPage'
import SettingsPage from './pages/SettingsPage'
import AdventurePage from './pages/AdventurePage'
import InventoryPage from './pages/InventoryPage'
import BossPage from './pages/BossPage'
import KodexPage from './pages/KodexPage'
import ForgePage from './pages/ForgePage'
import ArenaPage from './pages/ArenaPage'
import QuestsPage from './pages/QuestsPage'
import AchievementsPage from './pages/AchievementsPage'
import LoadoutPage from './pages/LoadoutPage'
import NotificationsPage from './pages/NotificationsPage'
import RPGPage from './pages/RPGPage'

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
      </Route>
      <Route path="/invite/:username" element={<InviteRedirect />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
function InviteRedirect() {
  const { username } = useParams()
  return <Navigate to={`/friends?add=${username}`} replace />
}