import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAdventure } from '../context/AdventureContext'
import { useNotifications } from '../context/NotificationContext'
import { XPBar } from './'
import NotificationBell from '../components/NotificationBell'
import LevelUpModal from './LevelUpModal'
import DropReveal from './DropReveal'
import AchievementToast from './AchievementToast'
import { LayoutDashboard, ListTodo, User, BarChart3, Trophy, Users, Swords, Settings, LogOut, Menu, X, Map, Bell, Award } from 'lucide-react'
import { useState } from 'react'
const navItems = [
  { to:'/dashboard', icon:LayoutDashboard, label:'Dashboard' },
  { to:'/tasks', icon:ListTodo, label:'Tasks' },
  { to:'/adventure', icon:Map, label:'Abenteuer' },
  { to:'/character', icon:User, label:'Held' },
  { to:'/stats', icon:BarChart3, label:'Stats' },
  { to:'/leaderboard', icon:Trophy, label:'Rang' },
  { to:'/achievements', icon:Award, label:'Erfolge' },
  { to:'/friends', icon:Users, label:'Freunde', badge:'friends' },
  { to:'/challenges', icon:Swords, label:'Duelle' },
  { to:'/notifications', icon:Bell, label:'Nachrichten', badge:'notifications' },
  { to:'/settings', icon:Settings, label:'Einstellungen' }
]
const mobileNavItems = navItems.slice(0, 5)
export default function Layout() {
  const { signOut, profile } = useAuth()
  const { pendingFriendTasksCount } = useAdventure()
  const { unreadCount } = useNotifications()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-dark-500 flex flex-col lg:flex-row">
      <aside className="hidden lg:flex flex-col w-64 bg-dark-300 border-r border-gray-800 min-h-screen fixed left-0 top-0 bottom-0 z-30">
        <div className="p-6 border-b border-gray-800"><h1 className="font-title text-2xl text-gold-400">⚔️ TaskRPG</h1></div>
        <div className="px-4 py-3 border-b border-gray-800"><XPBar compact /></div>
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2"><span className="text-2xl">{profile?.avatar_url||'🧙‍♂️'}</span><span className="text-sm text-gray-300 font-semibold truncate">{profile?.username||'Held'}</span></div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item=>(
            <NavLink key={item.to} to={item.to} className={({isActive})=>`nav-link ${isActive?'active':''}`}>
              <item.icon className="w-5 h-5"/><span className="text-sm">{item.label}</span>
              {item.badge==='friends'&&pendingFriendTasksCount>0&&<span className="ml-auto bg-gold-500 text-dark-500 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingFriendTasksCount}</span>}
              {item.badge==='notifications'&&unreadCount>0&&<span className="ml-auto bg-gold-500 text-dark-500 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{unreadCount>9?'9+':unreadCount}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={signOut} className="nav-link w-full text-red-400 hover:text-red-300"><LogOut className="w-5 h-5"/><span className="text-sm">Ausloggen</span></button>
        </div>
      </aside>
      <header className="lg:hidden flex items-center justify-between p-3 bg-dark-300 border-b border-gray-800 sticky top-0 z-30">
        <h1 className="font-title text-lg text-gold-400">⚔️ TaskRPG</h1>
        <div className="flex items-center gap-3"><XPBar compact/><NotificationBell/><button onClick={()=>setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-400">{sidebarOpen?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}</button></div>
      </header>
      {sidebarOpen&&(
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setSidebarOpen(false)}/>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-dark-300 shadow-xl p-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
              <span className="text-3xl">{profile?.avatar_url||'🧙‍♂️'}</span>
              <div><p className="text-gray-200 font-semibold">{profile?.username||'Held'}</p><button onClick={()=>{signOut();setSidebarOpen(false)}} className="text-xs text-red-400">Ausloggen</button></div>
            </div>
            <nav className="space-y-1">
              {navItems.map(item=>(
                <NavLink key={item.to} to={item.to} onClick={()=>setSidebarOpen(false)} className={({isActive})=>`nav-link ${isActive?'active':''}`}>
                  <item.icon className="w-5 h-5"/><span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-4"><div className="max-w-4xl mx-auto p-4 lg:p-6"><Outlet/></div></main>
      <div className="hidden lg:block fixed top-4 right-6 z-40"><NotificationBell/></div>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-300/95 backdrop-blur-lg border-t border-gray-800 z-30">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map(item=>(
            <NavLink key={item.to} to={item.to} className={({isActive})=>`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors relative ${isActive?'text-gold-400':'text-gray-500'}`}>
              <item.icon className="w-5 h-5"/><span className="text-[10px]">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <LevelUpModal/>
      <DropReveal/>
      <AchievementToast/>
    </div>
  )
}