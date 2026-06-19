import { useContext } from 'react'
import GameContext from '../context/GameContext'

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame muss innerhalb eines GameProvider verwendet werden')
  return context
}
