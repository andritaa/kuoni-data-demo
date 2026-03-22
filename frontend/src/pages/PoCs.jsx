import React, { useState } from 'react'

const BLUE = '#003366'
const GOLD = '#C9A96E'

const STATUS_COLORS = {
  'Draft': { bg: '#f3f4f6', text: '#6b7280' },
  'In Progress': { bg: '#dbeafe', text: '#1d4ed8' },
  'Complete': { bg: '#d1fae5', text: '#059669' },
}

const initialPoCs = [
  { id: 1, name: 'Booking Revenue Analytics', description: 'Real-time revenue dashboards pulling from Snowflake booking data across all DERTOUR brands. Daily/weekly/monthly trends with drill-down by brand, destination, and channel.', status: 'In Progress', owner: 'Stephen Adebola', start: '2026-03-20', target: '2026-04-15', snowflake: 'KUONI_DW.ANALYTICS.BOOKING_REVENUE_V', notes: 'Connected to live Snowflake. Initial KPIs rendering.' },
  { id: 2, name: 'Customer Segmentation Model', description: 'ML-driven customer segmentation using booking history, demographics, and behaviour patterns. Identify high-value segments for targeted marketing across Kuoni, Apollo, and DERTOUR brands.', status: 'Draft', owner: 'Data Team', start: '', target: '2026-05-01', snowflake: 'KUONI_DW.ML.CUSTOMER_SEGMENTS', notes: 'Awaiting data access approval. Schema design in progress.' },
  { id: 3, name: 'Real-time Inventory Dashboard', description: 'Live availability and pricing dashboard for hotel and flight inventory. Shows unsold capacity, pricing opportunities, and demand forecasting across the DERTOUR portfolio.', status: 'Draft', owner: 'Stephen Adebola', start: '', target: '2026-05-15', snowflake: 'KUONI_DW.OPS.INVENTORY_LIVE_V', notes: 'Requires Snowpipe integration for real-time feeds.' },
  { id: 4, name: 'Dynamics 365 ↔ Snowflake Integration', description: 'Connect Dynamics 365 CRM/ERP to Snowflake via the native Dataverse connector. Unify CRM data (accounts, opportunities, cases) with booking and financial data for a true Customer 360 and cross-brand analytics.', status: 'Draft', owner: 'Stephen Adebola', start: '', target: '2026-05-01', snowflake: 'DERTOUR_DW.BRONZE.D365_*', notes: 'Requires Dynamics 365 tenant access + Dataverse connector setup. Native connector GA since Aug 2025 — no middleware needed.' },
  { id: 5, name: 'AI Data Assistant (Andrita)', description: 'Natural language chatbot that queries Snowflake in real time. Users ask questions in plain English, the assistant generates SQL, executes it, and returns answers with data tables. RAG knowledge base for context. Multimodal — accepts images.', status: 'In Progress', owner: 'Stephen Adebola', start: '2026-03-20', target: '2026-04-01', snowflake: 'KUONI_DEMO.KNOWLEDGE_BASE.DOCUMENTS', notes: 'Live on the portal. Uses GPT-5.4-mini + Snowflake Cortex vector embeddings. 6 docs in knowledge base.' },
]

export default function PoCs() {
  const [pocs, setPocs] = useState(initialPoCs)
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: BLUE }}>Proof of Concepts</h2>
        <p className="text-gray-500 text-sm mt-1">Track PoCs across the DERTOUR data platform</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {['Draft', 'In Progress', 'Complete'].map(status => {
          const count = pocs.filter(p => p.status === status).length
          const sc = STATUS_COLORS[status]
          return (
            <div key={status} className="rounded-xl p-5 border border-gray-100 shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{status}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: sc.bg, color: sc.text }}>{count}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* PoC Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full min-w-[700px]">
          <thead>
            <tr style={{ background: BLUE }}>
              {['PoC Name', 'Status', 'Owner', 'Start', 'Target', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-white uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pocs.map((poc, i) => {
              const sc = STATUS_COLORS[poc.status]
              return (
                <React.Fragment key={poc.id}>
                  <tr className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                      onClick={() => setExpanded(expanded === poc.id ? null : poc.id)}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-sm" style={{ color: BLUE }}>{poc.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{poc.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>{poc.status}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{poc.owner}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{poc.start || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{poc.target}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">{expanded === poc.id ? '▲' : '▼'}</td>
                  </tr>
                  {expanded === poc.id && (
                    <tr>
                      <td colSpan={6} className="px-5 py-4 bg-blue-50/30 border-b">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div>
                            <p className="font-semibold text-xs uppercase text-gray-400 mb-1">Description</p>
                            <p className="text-gray-700">{poc.description}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-xs uppercase text-gray-400 mb-1">Snowflake Objects</p>
                            <code className="text-xs px-2 py-1 bg-gray-100 rounded">{poc.snowflake}</code>
                            <p className="font-semibold text-xs uppercase text-gray-400 mb-1 mt-3">Notes</p>
                            <p className="text-gray-600 text-sm">{poc.notes}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
