import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCharacter } from '../hooks/useCharacter'
import CharacterCreation from './CharacterCreation'
import LoadingSpinner from './LoadingSpinner'
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { character } = useCharacter()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (!character) return <CharacterCreation />
  return children
}