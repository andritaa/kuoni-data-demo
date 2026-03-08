import React, { useEffect, useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8010'
const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'

const scoreColor = (s) => s >= 98 ? '#27AE60' : s >= 90 ? '#F39C12' : '#E74C3C'
const scoreLabel = (s) => s >= 98 ? 'Excellent' : s >= 90 ? 'Good' : s >= 75 ? 'Fair' : 'Poor'

const dimensions = [
  { key: 'completeness', label: 'Completeness', icon: '✅', desc: 'All required fields are populated' },
  { key: 'validity', label: 'Validity', icon: '🔍', desc: 'Values conform to business rules and formats' },
  { key: 'uniqueness', label: 'Uniqueness', icon: '🔑', desc: 'No unexpected duplicates' },
  { key: 'referential', label: 'Referential Integrity', icon: '🔗', desc: 'Foreign keys resolve to valid parent records' },
  { key: 'timeliness', label: 'Timeliness', icon: '⏱️', desc: 'Data is fresh and loaded within expected SLA' },
]

const issueLabels = {
  null_email: 'Null email addresses',
  null_name: 'Missing first/last name',
  invalid_postcode: 'Invalid postcode format',
  duplicate_email: 'Duplicate email addresses',
  null_value: 'Null booking values',
  missing_customer: 'Orphaned bookings (no customer)',
  missing_product: 'Orphaned bookings (no product)',
  future_booking_date: 'Booking date in future',
  null_price: 'Null base price',
  missing_destination: 'Products with no destination',
  inactive: 'Inactive records',
  null_country: 'Missing country',
}

const tableIcons = {
  RAW_CUSTOMERS: '👥',
  RAW_BOOKINGS: '✈️',
  RAW_PRODUCTS: '🏖️',
  RAW_DESTINATIONS: '🌍',
}

// Simulated dimension scores per table
const getDimensionScores = (table, overallScore) => {
  const base = overallScore
  const seeds = { RAW_CUSTOMERS: [94,91,92,100,88], RAW_BOOKINGS: [98,97,100,98,95], RAW_PRODUCTS: [96,95,100,97,90], RAW_DESTINATIONS: [100,100,100,100,98] }
  const vals = seeds[table] || [95,95,95,95,95]
  return dimensions.map((d, i) => ({ dimension: d.label, score: vals[i] }))
}

export default function DataQuality() {
  const [dq, setDq] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/data-quality`)
      .then(r => r.json())
      .then(d => { setDq(d); setSelected(d.checks[0]?.table) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const checks = dq?.checks || []
  const selectedCheck = checks.find(c => c.table === selected)
  const dimScores = selectedCheck ? getDimensionScores(selected, selectedCheck.score) : []
  const overallScore = dq?.overall_score || 0

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header scorecard */}
      <div className="rounded-xl p-6 mb-6 flex flex-wrap gap-6 items-center" style={{ background: TEAL, color: 'white' }}>
        <div>
          <p className="text-xs uppercase tracking-widest mb-1 opacity-70">Overall DQ Score</p>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-bold" style={{ color: GOLD }}>{loading ? '…' : overallScore}</span>
            <span className="text-2xl text-white/60 mb-1">/100</span>
          </div>
          <p className="text-sm mt-1" style={{ color: GOLD }}>{scoreLabel(overallScore)}</p>
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
          {checks.map(c => (
            <div key={c.table} className="bg-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/20 transition-all border-2"
              style={{ borderColor: selected === c.table ? GOLD : 'transparent' }}
              onClick={() => setSelected(c.table)}>
              <div className="flex items-center gap-2 mb-2">
                <span>{tableIcons[c.table] || '📊'}</span>
                <span className="text-xs font-semibold truncate">{c.table.replace('RAW_', '')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/20 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${c.score}%`, background: scoreColor(c.score) }} />
                </div>
                <span className="text-xs font-bold" style={{ color: scoreColor(c.score) }}>{c.score}%</span>
              </div>
              <p className="text-xs text-white/50 mt-1">{c.total_rows?.toLocaleString()} rows</p>
            </div>
          ))}
        </div>
      </div>

      {selectedCheck && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Radar chart */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: TEAL }}>
              {tableIcons[selected]} {selected.replace('RAW_', '')} — Quality Dimensions
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={dimScores}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Radar dataKey="score" stroke={TEAL} fill={TEAL} fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {dimScores.map(d => (
                <div key={d.dimension} className="text-center">
                  <p className="text-xs font-bold" style={{ color: scoreColor(d.score) }}>{d.score}%</p>
                  <p className="text-xs text-gray-500 leading-tight">{d.dimension}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Issue breakdown */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: TEAL }}>
              Issues Found — {selectedCheck.total_issues} total
            </h3>
            {Object.entries(selectedCheck.issues).length === 0 ? (
              <div className="flex items-center justify-center h-40 text-green-600 font-semibold">✅ No issues detected</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(selectedCheck.issues).map(([key, count]) => {
                  const pct = Math.round((count / selectedCheck.total_rows) * 100 * 10) / 10
                  const severity = pct > 5 ? 'red' : pct > 1 ? 'amber' : 'green'
                  const colors = { red: ['#FEE2E2', '#991B1B', '#EF4444'], amber: ['#FEF3C7', '#92400E', '#F59E0B'], green: ['#D1FAE5', '#065F46', '#10B981'] }
                  const [bg, text, bar] = colors[severity]
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-700">{issueLabels[key] || key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: text }}>{count.toLocaleString()}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: bg, color: text }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(pct * 5, 100)}%`, background: bar }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DQ Rules & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: TEAL }}>📋 DQ Rules Applied</h3>
          <div className="space-y-2">
            {[
              { rule: 'Email format validation', table: 'CUSTOMERS', status: 'pass', type: 'Validity' },
              { rule: 'Booking value > £0', table: 'BOOKINGS', status: 'pass', type: 'Validity' },
              { rule: 'Customer referential integrity', table: 'BOOKINGS', status: 'pass', type: 'Referential' },
              { rule: 'Product referential integrity', table: 'BOOKINGS', status: 'pass', type: 'Referential' },
              { rule: 'No duplicate customer emails', table: 'CUSTOMERS', status: 'fail', type: 'Uniqueness' },
              { rule: 'Postcode format (UK)', table: 'CUSTOMERS', status: 'warn', type: 'Validity' },
              { rule: 'Destination always active', table: 'PRODUCTS', status: 'warn', type: 'Validity' },
              { rule: 'Booking date ≤ today', table: 'BOOKINGS', status: 'pass', type: 'Validity' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️'}</span>
                  <div>
                    <p className="text-xs font-medium">{r.rule}</p>
                    <p className="text-xs text-gray-400">{r.table} · {r.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: TEAL }}>🔧 Remediation Recommendations</h3>
          <div className="space-y-3">
            {[
              { priority: 'HIGH', issue: 'Duplicate customer emails in RAW_CUSTOMERS', action: 'Deduplicate in Silver layer using deterministic matching on email + name + postcode. Apply UNIQUE constraint in DIM_CUSTOMER', effort: '2 days' },
              { priority: 'MEDIUM', issue: 'Invalid UK postcodes', action: 'Apply Royal Mail PAF lookup in Silver transformation. Flag unresolvable addresses for CRM team review', effort: '1 day' },
              { priority: 'MEDIUM', issue: 'Inactive product bookings', action: 'Archive inactive products to BRONZE.RAW_PRODUCTS_ARCHIVE. Prevent future bookings in source system', effort: '3 days' },
              { priority: 'LOW', issue: 'Missing customer consent flags', action: 'Add GDPR_CONSENT column to DQ monitoring. Alert on any NULL before DSAR deadline', effort: '0.5 days' },
            ].map((r, i) => (
              <div key={i} className="rounded-lg p-3 border" style={{ borderColor: r.priority === 'HIGH' ? '#FECACA' : r.priority === 'MEDIUM' ? '#FDE68A' : '#BBF7D0', background: r.priority === 'HIGH' ? '#FFF5F5' : r.priority === 'MEDIUM' ? '#FFFBEB' : '#F0FDF4' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: r.priority === 'HIGH' ? '#FEE2E2' : r.priority === 'MEDIUM' ? '#FEF3C7' : '#D1FAE5', color: r.priority === 'HIGH' ? '#991B1B' : r.priority === 'MEDIUM' ? '#92400E' : '#065F46' }}>{r.priority}</span>
                  <span className="text-xs font-semibold text-gray-800">{r.issue}</span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{r.action}</p>
                <p className="text-xs text-gray-400">⏱ Effort: {r.effort}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DQ Architecture note */}
      <div className="rounded-xl p-5 text-white" style={{ background: TEAL }}>
        <h3 className="font-bold mb-3">🏗️ Recommended DQ Architecture for Kuoni</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { title: 'Prevention', icon: '🛡️', items: ['Schema contracts on all Bronze tables', 'Snowpipe rejection queues for malformed records', 'Source system API validation before load'] },
            { title: 'Detection', icon: '🔍', items: ['dbt tests (not_null, unique, accepted_values)', 'Great Expectations or Soda Core for row-level checks', 'Snowflake streams for CDC anomaly detection'] },
            { title: 'Resolution', icon: '🔧', items: ['Automated dedup in Silver layer', 'DQ issue Slack/Teams alerting', 'Data Steward workflow in Atlan or Alation'] },
          ].map(s => (
            <div key={s.title} className="bg-white/10 rounded-lg p-4">
              <p className="font-semibold mb-2" style={{ color: GOLD }}>{s.icon} {s.title}</p>
              <ul className="space-y-1">{s.items.map(i => <li key={i} className="text-xs text-white/80 flex gap-1.5"><span style={{ color: GOLD }}>→</span>{i}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
