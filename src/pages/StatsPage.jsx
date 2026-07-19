// Datei: src/pages/StatsPage.jsx
// Statistiken: XP-Verlauf, erledigte Tasks, Streak-Kalender
import { useCharacter } from '../hooks/useCharacter'
import { useGame } from '../hooks/useGame'
import { getStreakCalendarData, formatDate, calculateTodayXp } from '../utils/streak'
import { BarChart3, TrendingUp, Flame, Calendar, CheckCircle2, Zap } from 'lucide-react'

export default function StatsPage() {
  const { character, levelInfo, streak, todayXp, weekXp, completions } = useCharacter()
  const { tasks } = useGame()

  // Streak-Kalender (letzte 35 Tage = 5 Wochen)
  const calendarData = getStreakCalendarData(completions, 35)

  // Gesamtstatistiken
  const totalCompletions = completions.length
  const totalXp = character?.xp || 0
  const activeTasks = tasks.filter(t => t.is_active).length

  // XP der letzten 7 Tage
  const last7DaysXp = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = formatDate(date)
    const dayXp = completions
      .filter(c => formatDate(c.completed_at) === dateStr)
      .reduce((sum, c) => sum + (c.xp_gained || 0), 0)
    const dayLabel = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()]
    last7DaysXp.push({ label: dayLabel, xp: dayXp, date: dateStr })
  }
  const maxXp = Math.max(...last7DaysXp.map(d => d.xp), 1)

  // Kategorie-Verteilung
  const categoryCounts = {}
  completions.forEach(c => {
    const task = tasks.find(t => t.id === c.task_id)
    if (task) {
      categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1
    }
  })

  const categoryEmojis = {
    haushalt: '🏠',
    gesundheit: '💊',
    lernen: '📚',
    arbeit: '💼',
    sport: '🏋️'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400">📊 Statistiken</h1>

      {/* Übersichtskarten */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card text-center py-4">
          <Zap className="w-5 h-5 text-gold-400 mx-auto mb-1" />
          <span className="text-2xl font-title text-gold-300 font-bold">{totalXp}</span>
          <p className="text-xs text-gray-500 mt-1">Gesamt-XP</p>
        </div>
        <div className="card text-center py-4">
          <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <span className="text-2xl font-title text-green-300 font-bold">{totalCompletions}</span>
          <p className="text-xs text-gray-500 mt-1">Erledigt</p>
        </div>
        <div className="card text-center py-4">
          <Flame className={`w-5 h-5 mx-auto mb-1 ${streak > 0 ? 'text-orange-400' : 'text-gray-600'}`} />
          <span className={`text-2xl font-title font-bold ${streak > 0 ? 'text-orange-300' : 'text-gray-600'}`}>
            {streak}
          </span>
          <p className="text-xs text-gray-500 mt-1">Streak</p>
        </div>
        <div className="card text-center py-4">
          <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <span className="text-2xl font-title text-blue-300 font-bold">{levelInfo.level}</span>
          <p className="text-xs text-gray-500 mt-1">Level</p>
        </div>
      </div>

      {/* XP der letzten 7 Tage (Balkendiagramm) */}
      <div className="card">
        <h2 className="font-title text-lg text-gray-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold-500" />
          XP letzte 7 Tage
        </h2>
        <div className="flex items-end gap-2 h-40">
          {last7DaysXp.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <span className="text-xs text-gold-400 font-semibold mb-1">
                {day.xp > 0 ? day.xp : ''}
              </span>
              <div className="w-full bg-dark-400 rounded-t relative" style={{ height: '100%' }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gold-600 to-gold-400 rounded-t transition-all duration-700"
                  style={{ height: `${(day.xp / maxXp) * 100}%` }}
                />
              </div>
              <span className={`text-xs mt-1 ${day.date === formatDate(new Date()) ? 'text-gold-400 font-bold' : 'text-gray-500'}`}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak-Kalender */}
      <div className="card">
        <h2 className="font-title text-lg text-gray-200 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gold-500" />
          Streak-Kalender
        </h2>
        <div className="grid grid-cols-7 gap-1.5">
          {/* Wochentage */}
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
            <div key={d} className="text-center text-xs text-gray-600 pb-1">{d}</div>
          ))}
          {/* Tage auffüllen bis Montag */}
          {(() => {
            const firstDay = new Date(calendarData[0]?.date)
            const dayOfWeek = (firstDay.getDay() + 6) % 7 // Montag = 0
            const fillers = Array.from({ length: dayOfWeek }, (_, i) => (
              <div key={`fill-${i}`} className="w-full aspect-square" />
            ))
            return fillers
          })()}
          {/* Tatsächliche Tage */}
          {calendarData.map((day, i) => {
            const isToday = day.date === formatDate(new Date())
            return (
              <div
                key={i}
                className={`w-full aspect-square rounded-md flex items-center justify-center text-xs transition-all
                  ${day.completed
                    ? 'bg-green-600/40 border border-green-500/30'
                    : 'bg-dark-400 border border-gray-800'
                  }
                  ${isToday ? 'ring-2 ring-gold-500' : ''}`}
                title={day.date}
              >
                {new Date(day.date).getDate()}
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-600/40 border border-green-500/30" /> Aktiv
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-dark-400 border border-gray-800" /> Inaktiv
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded ring-2 ring-gold-500" /> Heute
          </span>
        </div>
      </div>

      {/* Kategorie-Verteilung */}
      {Object.keys(categoryCounts).length > 0 && (
        <div className="card">
          <h2 className="font-title text-lg text-gray-200 mb-3">📋 Nach Kategorie</h2>
          <div className="space-y-2">
            {Object.entries(categoryCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-lg">{categoryEmojis[cat] || '📝'}</span>
                  <span className="text-sm text-gray-300 flex-1 capitalize">{cat}</span>
                  <span className="text-sm text-gold-400 font-semibold">{count}x</span>
                  <div className="w-24 h-2 bg-dark-400 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold-500 rounded-full"
                      style={{ width: `${(count / totalCompletions) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
