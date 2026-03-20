import React, { useState } from 'react'

const BLUE = '#003366'
const GOLD = '#C9A96E'

const prepItems = [
  { id: 1, label: 'Review DERTOUR Group brand structure & corporate hierarchy' },
  { id: 2, label: 'Prepare architecture demo — show live Snowflake dashboard' },
  { id: 3, label: 'Print business cards / have digital card ready' },
  { id: 4, label: 'Prepare PoC proposals — 3 data-driven quick wins' },
  { id: 5, label: 'Review Snowflake current state assessment & recommendations' },
  { id: 6, label: 'Charge laptop & test portal works on mobile hotspot' },
]

export default function Travel() {
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dertour_prep') || '{}') } catch { return {} }
  })

  const toggle = (id) => {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    localStorage.setItem('dertour_prep', JSON.stringify(next))
  }

  const done = Object.values(checked).filter(Boolean).length
  const pct = Math.round((done / prepItems.length) * 100)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: BLUE }}>Travel & Meetings</h2>
        <p className="text-gray-500 text-sm mt-1">Logistics and preparation</p>
      </div>

      {/* Meeting Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 flex items-center gap-4" style={{ background: BLUE }}>
          <span className="text-3xl">🏢</span>
          <div>
            <h3 className="text-white font-bold text-lg">DERTOUR Group Meeting</h3>
            <p style={{ color: GOLD }} className="text-sm font-medium">Monday 23 March 2026 · 9:00 AM</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">📍 Address</p>
              <p className="text-sm font-semibold" style={{ color: BLUE }}>Touristik House</p>
              <p className="text-sm text-gray-600">One Dorking Office Park</p>
              <p className="text-sm text-gray-600">Dorking, Surrey, RH4 1HJ</p>
            </div>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">🚆 Transport</p>
              <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-2">
                <p className="font-semibold" style={{ color: BLUE }}>Option A — Train (recommended)</p>
                <p className="text-gray-600">Walk to <strong>West Hampstead Thameslink</strong> (~5 min)</p>
                <p className="text-gray-600">Thameslink south → <strong>Sutton</strong> → change → <strong>Dorking Main</strong></p>
                <p className="text-gray-600">~1h 20m · <strong>Leave by 7:15 AM</strong></p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-sm space-y-2 mt-2">
                <p className="font-semibold" style={{ color: '#92400e' }}>Option B — Uber</p>
                <p className="text-gray-600">~1h 10m · £50-70 estimated · Book for 7:30 AM</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">📞 Contact</p>
              <p className="text-sm text-gray-600">DERTOUR Group UK (Kuoni brand office)</p>
            </div>
          </div>
          <div>
            {/* Google Maps Embed */}
            <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200" style={{ height: 280 }}>
              <iframe
                title="DERTOUR Dorking"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2506.5!2d-0.3324!3d51.2322!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4875da5e5ea52a03%3A0x6e1aa4c8a0e5d2f!2sDorking%20Office%20Park!5e0!3m2!1sen!2suk!4v1"
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>
        </div>
      </div>

      {/* Prep Checklist */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg" style={{ color: BLUE }}>Meeting Prep Checklist</h3>
            <p className="text-xs text-gray-400 mt-0.5">{done}/{prepItems.length} complete</p>
          </div>
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: pct === 100 ? '#059669' : GOLD }} />
          </div>
        </div>
        <div className="space-y-2">
          {prepItems.map(item => (
            <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="checkbox" checked={!!checked[item.id]} onChange={() => toggle(item.id)}
                className="w-4 h-4 rounded border-gray-300" style={{ accentColor: BLUE }} />
              <span className={`text-sm ${checked[item.id] ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
