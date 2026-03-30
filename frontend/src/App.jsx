import React, { useState } from 'react'
import AuthGate from './components/AuthGate'
import Dashboard from './pages/Dashboard'
import Architecture from './pages/Architecture'
import DataProducts from './pages/DataProducts'
import PoCs from './pages/PoCs'
import Tasks from './pages/Tasks'
import Travel from './pages/Travel'
import Stakeholders from './pages/Stakeholders'
import BrandOnboard from './pages/BrandOnboard'
import StrategyMap from './pages/StrategyMap'
import Chat from './pages/Chat'
import Customer360 from './pages/Customer360'

const BLUE = '#003366'
const GOLD = '#C9A96E'

const NAV = [
  { id: 'strategy', label: '🗺️ Strategy', sub: 'Interactive Architecture' },
  { id: 'dashboard', label: '📊 Dashboard', sub: 'Live Snowflake Data' },
  { id: 'pocs', label: '🧪 PoCs', sub: 'Proof of Concepts' },
  { id: 'tasks', label: '📋 Tasks', sub: 'Kanban Board' },
  { id: 'architecture', label: '🏗️ Architecture', sub: 'Platform Strategy' },
  { id: 'products', label: '📦 Data Products', sub: 'Data Mesh Catalogue' },
  { id: 'chat', label: '🤖 Ask Andrita', sub: 'AI Data Chatbot' },
  { id: 'customer360', label: '👤 Customer 360', sub: 'Lifetime Value' },
  { id: 'onboard', label: '🏗️ Onboarding', sub: 'Brand IaC Pipeline' },
  { id: 'stakeholders', label: '👥 People', sub: 'Stakeholder Map' },
  { id: 'travel', label: '✈️ Travel', sub: 'Meetings & Logistics' },
]

export default function App() {
  const urlPage = new URLSearchParams(window.location.search).get('page')
  const [page, setPage] = useState(urlPage || 'dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  const navigate = (id) => { setPage(id); setMenuOpen(false) }

  return (
    <AuthGate>
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#F8F6F3' }}>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 text-white" style={{ background: BLUE }}>
        <div>
          <h1 className="text-base font-bold tracking-widest">DERTOUR</h1>
          <p className="text-[10px]" style={{ color: GOLD }}>Data Intelligence Portal</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: GOLD, color: BLUE }}>❄️ LIVE</div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20">
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 z-50 shadow-xl" style={{ background: BLUE }}>
          <nav className="px-3 py-2 space-y-1 max-h-[60vh] overflow-y-auto">
            {NAV.map(n => (
              <button key={n.id} onClick={() => navigate(n.id)}
                className="w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3"
                style={{
                  background: page === n.id ? GOLD : 'transparent',
                  color: page === n.id ? BLUE : 'rgba(255,255,255,0.7)',
                }}>
                <span className="text-base">{n.label.split(' ')[0]}</span>
                <div>
                  <p className="text-sm font-medium">{n.label.split(' ').slice(1).join(' ')}</p>
                </div>
              </button>
            ))}
          </nav>
          <div className="px-5 py-3 border-t text-[11px] text-white/50" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            Stephen Adebola · Data Architect
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 text-white flex-col sticky top-0 h-screen" style={{ background: BLUE }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h1 className="text-lg font-bold tracking-widest">DERTOUR</h1>
          <p className="text-xs mt-0.5" style={{ color: GOLD }}>Data Intelligence Portal</p>
        </div>
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {NAV.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)}
              className="w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3"
              style={{
                background: page === n.id ? GOLD : 'transparent',
                color: page === n.id ? BLUE : 'rgba(255,255,255,0.7)',
              }}>
              <span className="text-base">{n.label.split(' ')[0]}</span>
              <div>
                <p className="text-sm font-medium">{n.label.split(' ').slice(1).join(' ')}</p>
                <p className="text-[10px] opacity-60">{n.sub}</p>
              </div>
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t text-xs" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <p className="font-medium">Stephen Adebola</p>
          <p className="opacity-50">Data Architect · Edge-AI LTD</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span className="opacity-50">Snowflake Connected</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar — desktop only */}
        <header className="hidden md:flex sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-3 items-center justify-between">
          <div>
            <h2 className="font-bold text-sm" style={{ color: BLUE }}>
              {NAV.find(n => n.id === page)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-gray-400">{NAV.find(n => n.id === page)?.sub}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">DERTOUR Group · March 2026</span>
            <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: GOLD, color: BLUE }}>
              ❄️ LIVE
            </div>
          </div>
        </header>

        {page === 'strategy' && <StrategyMap />}
        {page === 'dashboard' && <Dashboard />}
        {page === 'architecture' && <Architecture />}
        {page === 'products' && <DataProducts />}
        {page === 'pocs' && <PoCs />}
        {page === 'tasks' && <Tasks />}
        {page === 'chat' && <Chat />}
        {page === 'customer360' && <Customer360 />}
        {page === 'onboard' && <BrandOnboard />}
        {page === 'stakeholders' && <Stakeholders />}
        {page === 'travel' && <Travel />}
      </main>
    </div>
    </AuthGate>
  )
}
