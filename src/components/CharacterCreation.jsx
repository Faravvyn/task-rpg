import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { classDefinitions } from '../utils/xp'
import { Sparkles, Sword, Shield, Wand2, Heart, SkipForward } from 'lucide-react'
export default function CharacterCreation() {
  const { createCharacter, signOut, setCharacterManual } = useAuth()
  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const handleCreate = async () => {
    if (!name.trim()) { setError('Bitte gib einen Namen ein'); return }
    if (!selectedClass) { setError('Bitte wähle eine Klasse'); return }
    setCreating(true); setError('')
    try {
      const result = await createCharacter({ name: name.trim(), charClass: selectedClass, stats: { ...classDefinitions[selectedClass].baseStats } })
      if (result && result.error) {
        const msg = result.error.message || ''
        if (msg.includes('duplicate')||msg.includes('unique')) setError('Du hast bereits einen Charakter! Klicke "Überspringen".')
        else if (msg.includes('row-level')||msg.includes('policy')) setError('Zugriff verweigert. Logge dich aus und wieder ein.')
        else setError('Fehler: ' + msg)
        setCreating(false)
      }
    } catch (err) { setError('Fehler: ' + (err.message || 'Unbekannt')); setCreating(false) }
  }
  const handleSkip = () => setCharacterManual({ name:'Held', class:'krieger', level:1, xp:0, stats:{staerke:5,ausdauer:4,intelligenz:2,willenskraft:3}, bonus_points:0 })
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-500">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6 animate-fade-in">
          <Sparkles className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h1 className="font-title text-3xl text-gold-400 mb-2">Erstelle deinen Helden</h1>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Name</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="z.B. Aldric der Tapfere" className="input-field text-center text-lg" maxLength={30} onKeyDown={e=>e.key==='Enter'&&handleCreate()} />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-3">Klasse wählen</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(classDefinitions).map(([key, cls]) => (
              <button key={key} onClick={()=>setSelectedClass(key)} className={`p-3 rounded-xl border-2 transition-all text-left ${selectedClass===key?'border-gold-500 bg-gold-500/10':'border-gray-700 bg-dark-300 hover:border-gray-600'}`}>
                <h3 className={`font-title text-base mb-0.5 ${selectedClass===key?'text-gold-400':'text-gray-200'}`}>{cls.icon} {cls.name}</h3>
                <p className="text-xs text-gray-400">{cls.description}</p>
              </button>
            ))}
          </div>
        </div>
        {error&&<div className="mb-4 p-3 bg-red-900/40 border border-red-700/50 rounded-xl"><p className="text-red-300 text-sm">{error}</p></div>}
        <button onClick={handleCreate} disabled={creating||!name||!selectedClass} className="btn-primary w-full py-3 text-lg font-title">
          {creating?'Wird erstellt...':'⚔️ Abenteuer beginnen'}
        </button>
        <div className="flex items-center gap-3 my-4"><div className="flex-1 h-px bg-gray-700"/><span className="text-xs text-gray-600">oder</span><div className="flex-1 h-px bg-gray-700"/></div>
        <button onClick={handleSkip} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"><SkipForward className="w-4 h-4"/>Überspringen</button>
        <button onClick={()=>{signOut();setTimeout(()=>window.location.reload(),500)}} className="w-full text-center text-sm text-gray-500 hover:text-gray-300 py-2 mt-2">Ausloggen und neu versuchen</button>
      </div>
    </div>
  )
}