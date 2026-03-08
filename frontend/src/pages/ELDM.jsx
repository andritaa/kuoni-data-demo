import React, { useState } from 'react'

const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'

const entities = {
  CUSTOMER: {
    icon: '👥', color: '#1B4F6B', x: 60, y: 280,
    desc: 'Central subject — the premium traveller',
    attributes: [
      { name: 'customer_id', type: 'PK', key: true },
      { name: 'email', type: 'VARCHAR', pii: true },
      { name: 'first_name', type: 'VARCHAR', pii: true },
      { name: 'last_name', type: 'VARCHAR', pii: true },
      { name: 'date_of_birth', type: 'DATE', pii: true },
      { name: 'postcode', type: 'VARCHAR', pii: true },
      { name: 'segment', type: 'VARCHAR' },
      { name: 'loyalty_tier', type: 'VARCHAR' },
      { name: 'join_date', type: 'DATE' },
      { name: 'gdpr_consent', type: 'BOOLEAN' },
    ]
  },
  BOOKING: {
    icon: '✈️', color: '#2E6F8F', x: 340, y: 200,
    desc: 'Core transaction — the holiday booking',
    attributes: [
      { name: 'booking_id', type: 'PK', key: true },
      { name: 'customer_id', type: 'FK→CUSTOMER' },
      { name: 'product_id', type: 'FK→PRODUCT' },
      { name: 'agent_id', type: 'FK→AGENT' },
      { name: 'booking_date', type: 'DATE' },
      { name: 'travel_date', type: 'DATE' },
      { name: 'num_passengers', type: 'INTEGER' },
      { name: 'total_value_gbp', type: 'DECIMAL' },
      { name: 'margin_pct', type: 'DECIMAL' },
      { name: 'status', type: 'VARCHAR' },
      { name: 'channel', type: 'VARCHAR' },
    ]
  },
  PRODUCT: {
    icon: '🏖️', color: '#C9A96E', x: 600, y: 120,
    desc: 'Holiday package — the product sold',
    attributes: [
      { name: 'product_id', type: 'PK', key: true },
      { name: 'destination_id', type: 'FK→DESTINATION' },
      { name: 'product_name', type: 'VARCHAR' },
      { name: 'product_type', type: 'VARCHAR' },
      { name: 'duration_days', type: 'INTEGER' },
      { name: 'base_price_gbp', type: 'DECIMAL' },
      { name: 'all_inclusive', type: 'BOOLEAN' },
      { name: 'included_flights', type: 'BOOLEAN' },
    ]
  },
  DESTINATION: {
    icon: '🌍', color: '#8B4513', x: 620, y: 400,
    desc: 'Travel destination — the place',
    attributes: [
      { name: 'destination_id', type: 'PK', key: true },
      { name: 'destination_name', type: 'VARCHAR' },
      { name: 'country', type: 'VARCHAR' },
      { name: 'region', type: 'VARCHAR' },
      { name: 'continent', type: 'VARCHAR' },
      { name: 'tier', type: 'VARCHAR' },
      { name: 'avg_duration_days', type: 'INTEGER' },
      { name: 'peak_season_start', type: 'DATE' },
      { name: 'visa_required', type: 'BOOLEAN' },
    ]
  },
  AGENT: {
    icon: '🧑‍💼', color: '#4A7C9B', x: 60, y: 100,
    desc: 'Sales consultant who handled the booking',
    attributes: [
      { name: 'agent_id', type: 'PK', key: true },
      { name: 'full_name', type: 'VARCHAR' },
      { name: 'email', type: 'VARCHAR', pii: true },
      { name: 'branch_code', type: 'VARCHAR' },
      { name: 'region', type: 'VARCHAR' },
      { name: 'specialisation', type: 'VARCHAR' },
      { name: 'start_date', type: 'DATE' },
    ]
  },
  INTERACTION: {
    icon: '💬', color: '#27AE60', x: 340, y: 450,
    desc: 'Customer touchpoint — enquiry, quote, call',
    attributes: [
      { name: 'interaction_id', type: 'PK', key: true },
      { name: 'customer_id', type: 'FK→CUSTOMER' },
      { name: 'agent_id', type: 'FK→AGENT' },
      { name: 'interaction_date', type: 'DATE' },
      { name: 'channel', type: 'VARCHAR' },
      { name: 'interaction_type', type: 'VARCHAR' },
      { name: 'outcome', type: 'VARCHAR' },
      { name: 'duration_mins', type: 'INTEGER' },
    ]
  },
}

const relationships = [
  { from: 'CUSTOMER', to: 'BOOKING', label: 'places', cardinality: '1:N' },
  { from: 'BOOKING', to: 'PRODUCT', label: 'for', cardinality: 'N:1' },
  { from: 'PRODUCT', to: 'DESTINATION', label: 'travels to', cardinality: 'N:1' },
  { from: 'AGENT', to: 'BOOKING', label: 'manages', cardinality: '1:N' },
  { from: 'CUSTOMER', to: 'INTERACTION', label: 'has', cardinality: '1:N' },
  { from: 'AGENT', to: 'INTERACTION', label: 'handles', cardinality: '1:N' },
]

export default function ELDM() {
  const [selected, setSelected] = useState('BOOKING')

  const entity = entities[selected]

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="rounded-xl p-5 mb-6 flex items-start gap-4" style={{ background: TEAL, color: 'white' }}>
        <div className="text-4xl">📐</div>
        <div>
          <h1 className="text-xl font-bold mb-1">Enterprise Logical Data Model</h1>
          <p className="text-white/70 text-sm">Kuoni Core Business Entities — the canonical data model driving all analytics, reporting, and operational systems. Click any entity to explore attributes and relationships.</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full bg-white/10">6 Core Entities</span>
            <span className="text-xs px-2 py-1 rounded-full bg-white/10">6 Relationships</span>
            <span className="text-xs px-2 py-1 rounded-full bg-white/10">55 Attributes</span>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#FF6B6B44', color: '#FFB3B3' }}>🔒 5 PII Fields</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive diagram (left 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: TEAL }}>Entity Relationship Diagram — click an entity</h3>

          {/* Entity grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Object.entries(entities).map(([name, e]) => (
              <button key={name} onClick={() => setSelected(name)}
                className="rounded-xl p-3 border-2 text-left transition-all hover:shadow-md"
                style={{
                  borderColor: selected === name ? e.color : '#E5E7EB',
                  background: selected === name ? e.color + '12' : 'white',
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{e.icon}</span>
                  <span className="text-xs font-bold" style={{ color: e.color }}>{name}</span>
                </div>
                <p className="text-xs text-gray-500 leading-tight">{e.desc}</p>
              </button>
            ))}
          </div>

          {/* Relationship diagram */}
          <div className="rounded-xl p-4" style={{ background: '#F8F6F3', border: '1px solid #E5E7EB' }}>
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Relationships</p>
            <div className="space-y-2">
              {relationships.map((r, i) => {
                const from = entities[r.from]
                const to = entities[r.to]
                const isActive = selected === r.from || selected === r.to
                return (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg transition-all"
                    style={{ background: isActive ? TEAL + '12' : 'transparent', border: isActive ? `1px solid ${TEAL}30` : '1px solid transparent' }}>
                    <div className="flex items-center gap-1.5">
                      <span>{from.icon}</span>
                      <span className="text-xs font-bold" style={{ color: from.color }}>{r.from}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <div className="flex-1 border-t border-dashed border-gray-300" />
                      <span className="text-xs text-gray-500 px-2 whitespace-nowrap">{r.label}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: GOLD + '30', color: '#78350F' }}>{r.cardinality}</span>
                      <div className="flex-1 border-t border-dashed border-gray-300" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>{to.icon}</span>
                      <span className="text-xs font-bold" style={{ color: to.color }}>{r.to}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Entity detail panel (right 1/3) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{entity.icon}</span>
            <div>
              <h3 className="font-bold" style={{ color: entity.color }}>{selected}</h3>
              <p className="text-xs text-gray-500">{entity.desc}</p>
            </div>
          </div>

          <div className="space-y-1.5 mb-4">
            {entity.attributes.map(attr => (
              <div key={attr.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{attr.key ? '🔑' : attr.pii ? '🔒' : '  '}</span>
                  <span className={`text-xs font-mono ${attr.key ? 'font-bold' : ''}`} style={{ color: attr.key ? entity.color : '#374151' }}>{attr.name}</span>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                  style={{ background: attr.type.includes('FK') ? '#EBF4F8' : '#F3F4F6', color: attr.type.includes('FK') ? TEAL : '#6B7280' }}>
                  {attr.type}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-lg p-3" style={{ background: TEAL + '10', border: `1px solid ${TEAL}20` }}>
            <p className="text-xs font-semibold mb-2" style={{ color: TEAL }}>📊 In the Medallion Architecture</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-start gap-2"><span style={{color:'#CD7F32'}}>BRONZE</span><span>→ RAW_{selected}s (immutable, string-typed)</span></div>
              <div className="flex items-start gap-2"><span style={{color:'#888'}}>SILVER</span><span>→ DIM_{selected} / FCT_{selected === 'BOOKING' ? 'BOOKING' : selected} (typed, deduped)</span></div>
              <div className="flex items-start gap-2"><span style={{color:GOLD}}>GOLD</span><span>→ RPT_* views (aggregated, business-ready)</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Design principles */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: '🔑', title: 'Surrogate Keys', desc: 'All entities use system-generated surrogate keys. Natural keys retained as business keys for traceability.' },
          { icon: '🔒', title: 'PII Governance', desc: '5 PII fields tagged across the model. Dynamic data masking in Snowflake for role-based access. GDPR consent tracked at customer level.' },
          { icon: '📅', title: 'Slowly Changing Dims', desc: 'CUSTOMER and AGENT use SCD Type 2 — full history preserved with effective dates. PRODUCT uses SCD Type 1 (overwrite).' },
          { icon: '⏱️', title: 'Temporal Design', desc: 'All fact tables carry booking_date and travel_date separately — enables both booking-period and travel-period analysis without self-join.' },
        ].map(p => (
          <div key={p.title} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">{p.icon}</div>
            <h4 className="text-xs font-bold mb-1" style={{ color: TEAL }}>{p.title}</h4>
            <p className="text-xs text-gray-600 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
