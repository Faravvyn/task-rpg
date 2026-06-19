import { useMemo } from 'react'
import { useGame } from './useGame'
import { isTaskAvailable } from '../utils/streak'
export function useTasks() {
  const { tasks, completions, createTask, editTask, deleteTask, completeTask } = useGame()
  const availableTasks = useMemo(() => tasks.filter(task => isTaskAvailable(task, completions)), [tasks, completions])
  const completedToday = useMemo(() => tasks.filter(task => !isTaskAvailable(task, completions) && task.is_active), [tasks, completions])
  const activeTasks = useMemo(() => tasks.filter(t => t.is_active), [tasks])
  const tasksByCategory = useMemo(() => {
    const grouped = {}
    activeTasks.forEach(task => {
      if (!grouped[task.category]) grouped[task.category] = []
      grouped[task.category].push(task)
    })
    return grouped
  }, [activeTasks])
  return { tasks, availableTasks, completedToday, activeTasks, tasksByCategory, completions, createTask, editTask, deleteTask, completeTask }
}