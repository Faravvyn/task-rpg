import { useState } from 'react'
import { useAdventure } from '../context/AdventureContext'
import { useAuth } from '../context/AuthContext'
import { MONSTER_MAP, getMonsterImageUrl } from '../utils/monsters'
import { Sparkles, CheckCircle2 } from 'lucide-react'

export default function StarterTutorial() {
  const { character, updateCharacter } = useAuth()
  const { catchMonster, updateTeam } = useAdventure()
  const [selected, setSelected] = useState(null)
  const [step, setStep] = useState(0)

  if (!character || character.tutorial_done) return null

  const starters = ['ember_fox', 'aqua_turtle', 'leaf_owl']

  const handleFinish = async () => {
    const monster = await catchMonster(selected, 'Dein Partner')
    if (monster) {
      await updateTeam({ slot_1: monster.id })
      await updateCharacter({ tutorial_done: true })
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-dark-500 flex items-center justify-center p-4">
      <div className="card max-w-md w-full border-gold-500/50 shadow-[0_0_30px_rgba(212,160,23,0.3)] animate-bounce-in">
        {step === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="w-16 h-16 text-gold-400 mx-auto mb-4 animate-pulse" />
            <h2 className="font-title text-2xl text-gold-300 mb-2">Willkommen, Held!</h2>
            <p className="text-gray-400 text-sm mb-6">In dieser Welt sind Aufgaben deine Energie. Doch du musst diesen Weg nicht alleine gehen.</p>
            <button onClick={() => setStep(1)} className="btn-primary w-full py-3">Gefährten wählen</button>
          </div>
        ) : (
          <div>
            <h2 className="font-title text-xl text-gold-300 text-center mb-6">Wähle deinen Starter</h2>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {starters.map(id => {
                const m = MONSTER_MAP[id]
                return (
                  <button 
                    key={id} 
                    onClick={() => setSelected(id)}
                    className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${selected === id ? 'border-gold-500 bg-gold-500/10' : 'border-gray-800 bg-dark-400'}`}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden mb-2">
                       <img src={getMonsterImageUrl(m)} alt={m.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[9px] font-bold text-gray-200 uppercase">{m.name}</p>
                    <p className="text-[7px] text-gray-500 uppercase">{m.type}</p>
                  </button>
                )
              })}
            </div>
            
            {selected && (
              <div className="bg-dark-400 p-4 rounded-lg border border-gray-700 mb-6 animate-slide-up">
                 <p className="text-xs text-gray-300">"Der {MONSTER_MAP[selected].name} ist ein treuer Begleiter. Er wird durch deine tägliche Aktivität stärker."</p>
              </div>
            )}

            <button 
              onClick={handleFinish} 
              disabled={!selected}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Abenteuer beginnen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
