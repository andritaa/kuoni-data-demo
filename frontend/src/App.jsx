import React, { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Architecture from './pages/Architecture'
import DbxMapping from './pages/DbxMapping'
import DataQuality from './pages/DataQuality'
import ELDM from './pages/ELDM'
import SchemaDesign from './pages/SchemaDesign'

const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'

const NAV = [
  { id: 'dashboard', label: '📊 Dashboard', sub: 'Live Snowflake Data' },
  { id: 'architecture', label: '🏗️ Architecture', sub: 'Platform Strategy' },
  { id: 'dq', label: '🔍 Data Quality', sub: 'DQ Scorecard' },
  { id: 'schema', label: '📐 Schema Design', sub: 'Star Schema · DV2.0' },
  { id: 'databricks', label: '⚡ Databricks → SF', sub: 'Capability Mapping' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="min-h-screen" style={{ background: '#F8F6F3' }}>
      {/* Header */}
      <header style={{ background: TEAL }} className="shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-white text-lg font-bold tracking-widest">KUONI</h1>
              <p className="text-xs" style={{ color: GOLD }}>Data Intelligence Platform</p>
            </div>
            <div className="hidden md:flex gap-1 ml-6">
              {NAV.map(n => (
                <button key={n.id} onClick={() => setPage(n.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: page === n.id ? GOLD : 'rgba(255,255,255,0.1)',
                    color: page === n.id ? TEAL : 'white',
                  }}>
                  {n.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden lg:block">
              <p className="text-white text-xs">Data Architect Demo</p>
              <p className="text-xs" style={{ color: GOLD }}>DERTOUR · Kuoni · March 2026</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: GOLD, color: TEAL }}>
              ❄️ LIVE
            </div>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="flex md:hidden gap-1 px-4 pb-2 overflow-x-auto">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{ background: page === n.id ? GOLD : 'rgba(255,255,255,0.15)', color: page === n.id ? TEAL : 'white' }}>
              {n.label}
            </button>
          ))}
        </div>
      </header>

      {page === 'dashboard' && <Dashboard />}
      {page === 'architecture' && <Architecture />}
      {page === 'dq' && <DataQuality />}
      {page === 'schema' && <SchemaDesign />}
      {page === 'databricks' && <DbxMapping />}
    </div>
  )
}
