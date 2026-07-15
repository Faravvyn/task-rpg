import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import TaskItem from '../components/TaskItem'
import EmptyState from '../components/EmptyState'
import { Plus, X, Camera, Footprints } from 'lucide-react'
const categories=[{id:'haushalt',label:'🏠 Haushalt'},{id:'gesundheit',label:'💊 Gesundheit'},{id:'lernen',label:'📚 Lernen'},{id:'arbeit',label:'💼 Arbeit'},{id:'sport',label:'🏋️ Sport'},{id:'custom',label:'✏️ Eigenes...'}]
const difficulties=[{id:'leicht',label:'Leicht',xp:10,color:'text-green-400'},{id:'mittel',label:'Mittel',xp:25,color:'text-yellow-400'},{id:'schwer',label:'Schwer',xp:50,color:'text-red-400'}]
const repeatTypes=[{id:'einmalig',label:'Einmalig'},{id:'taeglich',label:'Täglich'},{id:'woechentlich',label:'Wöchentlich'}]
export default function TasksPage() {
  const { tasks, availableTasks, completedToday, completions, createTask, editTask } = useTasks()
  const [showForm,setShowForm]=useState(false)
  const [editingTask,setEditingTask]=useState(null)
  const [filterCategory,setFilterCategory]=useState('all')
  const [tab,setTab]=useState('open')
  const [formError,setFormError]=useState('')
  const [form,setForm]=useState({title:'',category:'haushalt',customCategory:'',difficulty:'mittel',repeat_type:'taeglich',verification_type:'none',verification_target:'',verification_value:''})
  const resetForm=()=>{setForm({title:'',category:'haushalt',customCategory:'',difficulty:'mittel',repeat_type:'taeglich',verification_type:'none',verification_target:'',verification_value:''});setShowForm(false);setEditingTask(null);setFormError('')}
  const handleSubmit=async(e)=>{
    e.preventDefault(); if(!form.title.trim()) return; setFormError('')
    const category=form.category==='custom'?form.customCategory.toLowerCase():form.category
    const payload = {
      title:form.title.trim(),
      category,
      difficulty:form.difficulty,
      repeat_type:form.repeat_type,
      verification_type:form.verification_type,
      verification_target:form.verification_target.trim() || null,
      verification_value: form.verification_type === 'steps' ? parseInt(form.verification_value) : null
    }
    if(editingTask){const{error}=await editTask(editingTask.id,payload);if(error){setFormError('Fehler: '+(error.message||'Unbekannt'));return}}
    else{const{error}=await createTask(payload);if(error){setFormError('Fehler: '+(error.message||'Unbekannt'));return}}
    resetForm()
  }
  const startEdit=(task)=>{
    setEditingTask(task);
    setForm({
      title:task.title,
      category:task.category,
      customCategory:'',
      difficulty:task.difficulty,
      repeat_type:task.repeat_type,
      verification_type:task.verification_type||'none',
      verification_target:task.verification_target||'',
      verification_value:task.verification_value||''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const filteredTasks=(()=>{
    let list; switch(tab){case'open':list=availableTasks;break;case'completed':list=completedToday;break;default:list=tasks.filter(t=>t.is_active)}
    if(filterCategory!=='all') list=list.filter(t=>t.category===filterCategory); return list
  })()
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between"><h1 className="font-title text-2xl text-gold-400">⚔️ Aufgaben</h1><button onClick={()=>{resetForm();setShowForm(true)}} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Neue Aufgabe</button></div>
      {showForm&&(
        <div className="card border-gold-500/30 animate-slide-up">
          <div className="flex items-center justify-between mb-4"><h3 className="font-title text-gold-400">{editingTask?'✏️ Bearbeiten':'✨ Neue Aufgabe'}</h3><button onClick={resetForm}><X className="w-5 h-5 text-gray-500"/></button></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm text-gray-400 mb-1">Titel</label><input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="input-field" required autoFocus/></div>
            <div><label className="block text-sm text-gray-400 mb-1">Kategorie</label><div className="grid grid-cols-3 gap-2">{categories.map(cat=><button key={cat.id} type="button" onClick={()=>setForm({...form,category:cat.id})} className={`text-sm px-3 py-2 rounded-lg border ${form.category===cat.id?'border-gold-500 bg-gold-500/10 text-gold-300':'border-gray-700 text-gray-400'}`}>{cat.label}</button>)}</div>{form.category==='custom'&&<input type="text" value={form.customCategory} onChange={e=>setForm({...form,customCategory:e.target.value})} placeholder="Eigene Kategorie..." className="input-field mt-2"/>}</div>
            <div><label className="block text-sm text-gray-400 mb-1">Schwierigkeit</label><div className="grid grid-cols-3 gap-2">{difficulties.map(diff=><button key={diff.id} type="button" onClick={()=>setForm({...form,difficulty:diff.id})} className={`text-sm px-3 py-2 rounded-lg border ${form.difficulty===diff.id?`border-current ${diff.color}`:'border-gray-700 text-gray-400'}`}><div>{diff.label}</div><div className="text-xs text-gold-500">+{diff.xp} XP</div></button>)}</div></div>
            <div><label className="block text-sm text-gray-400 mb-1">Wiederholung</label><div className="grid grid-cols-3 gap-2">{repeatTypes.map(rt=><button key={rt.id} type="button" onClick={()=>setForm({...form,repeat_type:rt.id})} className={`text-sm px-3 py-2 rounded-lg border ${form.repeat_type===rt.id?'border-gold-500 bg-gold-500/10 text-gold-300':'border-gray-700 text-gray-400'}`}>{rt.label}</button>)}</div></div>
            
            <div className="pt-2 border-t border-gray-800">
              <label className="block text-xs font-bold text-gold-500/80 uppercase tracking-widest mb-2">Verifizierung</label>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setForm({...form,verification_type:'none'})} className={`flex-1 py-2 rounded-lg border text-xs ${form.verification_type==='none'?'border-gold-500 bg-gold-500/10 text-gold-300':'border-gray-700 text-gray-500'}`}>Keine</button>
                <button type="button" onClick={()=>setForm({...form,verification_type:'photo'})} className={`flex-1 py-2 rounded-lg border text-xs flex items-center justify-center gap-1 ${form.verification_type==='photo'?'border-purple-500 bg-purple-500/10 text-purple-300':'border-gray-700 text-gray-500'}`}><Camera className="w-3 h-3"/> Foto</button>
                <button type="button" onClick={()=>setForm({...form,verification_type:'steps'})} className={`flex-1 py-2 rounded-lg border text-xs flex items-center justify-center gap-1 ${form.verification_type==='steps'?'border-blue-500 bg-blue-500/10 text-blue-300':'border-gray-700 text-gray-500'}`}><Footprints className="w-3 h-3"/> Schritte</button>
              </div>
              {form.verification_type==='photo' && (
                <div className="mt-2">
                  <input type="text" value={form.verification_target} onChange={e=>setForm({...form,verification_target:e.target.value})} placeholder="Was muss fotografiert werden? (z.B. Pflanze)" className="input-field text-sm" />
                </div>
              )}
              {form.verification_type==='steps' && (
                <div className="mt-2">
                  <input type="number" value={form.verification_value} onChange={e=>setForm({...form,verification_value:e.target.value})} placeholder="Benötigte Schritte (z.B. 10000)" className="input-field text-sm" />
                </div>
              )}
            </div>

            {formError&&<div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-2 text-red-300 text-sm">{formError}</div>}
            <button type="submit" className="btn-primary w-full">{editingTask?'💾 Speichern':'⚔️ Aufgabe erstellen'}</button>
          </form>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto">
        {[{id:'open',label:`Offen (${availableTasks.length})`},{id:'completed',label:`Erledigt (${completedToday.length})`},{id:'all',label:`Alle (${tasks.filter(t=>t.is_active).length})`}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`tab-btn whitespace-nowrap ${tab===t.id?'active':''}`}>{t.label}</button>)}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={()=>setFilterCategory('all')} className={`text-xs px-3 py-1 rounded-full border ${filterCategory==='all'?'border-gold-500 text-gold-400 bg-gold-500/10':'border-gray-700 text-gray-500'}`}>Alle</button>
        {categories.filter(c=>c.id!=='custom').map(cat=><button key={cat.id} onClick={()=>setFilterCategory(cat.id)} className={`text-xs px-3 py-1 rounded-full border ${filterCategory===cat.id?'border-gold-500 text-gold-400 bg-gold-500/10':'border-gray-700 text-gray-500'}`}>{cat.label}</button>)}
      </div>
      <div className="space-y-2">
        {filteredTasks.length===0?(
          tab==='open'
            ? <EmptyState emoji="🗡️" title="Keine offenen Aufgaben" subtitle="Der Held ruht sich aus. Erstelle eine neue Quest oder genieße den Frieden!" />
            : tab==='completed'
              ? <EmptyState emoji="🌙" title="Noch nichts erledigt" subtitle="Heute wartet noch Ruhm auf dich – schnapp dir eine Aufgabe!" />
              : <EmptyState emoji="📜" title="Keine Aufgaben" subtitle="Dein Questbuch ist leer. Zeit, neue Abenteuer zu planen!" />
        )
          :filteredTasks.map(task=><TaskItem key={task.id} task={task} completions={completions} onEdit={startEdit}/>)}
      </div>
    </div>
  )
}