import React, { useState } from 'react'

const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'
const NAVY = '#1A2D55'
const PURPLE = '#6A0D83'
const ORANGE = '#E86B1A'
const GREEN = '#27AE60'
const CRIMSON = '#C0392B'
const GREY = '#6C757D'

// ── Star Schema Data ──────────────────────────────────────────────────────────
const factTable = {
  name: 'FCT_BOOKING',
  layer: 'GOLD',
  icon: '⭐',
  desc: 'Every confirmed booking — the heartbeat of Kuoni\'s business',
  fks: ['date_sk', 'customer_sk', 'product_sk', 'destination_sk', 'agent_sk', 'channel_sk'],
  measures: ['total_value_gbp', 'margin_gbp', 'num_passengers', 'duration_days'],
  degenerate: ['booking_ref', 'booking_status', 'cancellation_flag'],
}

const dimensions = [
  {
    name: 'DIM_DATE', icon: '📅', color: '#2E6F8F', angle: 270,
    desc: 'Every date from 2020–2030 pre-populated',
    scd: 'Type 0',
    cols: ['date_sk (PK)', 'full_date', 'year', 'quarter', 'month_name', 'is_peak_season', 'is_weekend', 'fiscal_period'],
    business: 'Powers seasonal analysis — when do Kuoni customers book and when do they travel?',
  },
  {
    name: 'DIM_CUSTOMER', icon: '👥', color: '#1B4F6B', angle: 210,
    desc: 'Full customer history with PII masking',
    scd: 'Type 2',
    cols: ['customer_sk (PK)', 'customer_bk', 'first_name 🔒', 'last_name 🔒', 'email 🔒', 'segment', 'loyalty_tier', 'valid_from', 'valid_to', 'is_current'],
    business: 'Track how customers evolve — loyalty tier changes, segment movement, repeat booking patterns',
  },
  {
    name: 'DIM_PRODUCT', icon: '🏖️', color: GREEN, angle: 330,
    desc: 'Holiday packages and tailor-made itineraries',
    scd: 'Type 1',
    cols: ['product_sk (PK)', 'product_name', 'product_type', 'base_price_gbp', 'duration_days', 'all_inclusive', 'included_flights'],
    business: 'Which packages generate the best margin? Which destinations are underperforming?',
  },
  {
    name: 'DIM_DESTINATION', icon: '🌍', color: ORANGE, angle: 30,
    desc: 'Global destination reference data',
    scd: 'Type 1',
    cols: ['destination_sk (PK)', 'destination_name', 'country', 'region', 'continent', 'tier', 'visa_required', 'peak_season'],
    business: 'Destination profitability, seasonal demand patterns, emerging vs established markets',
  },
  {
    name: 'DIM_AGENT', icon: '🧑‍💼', color: PURPLE, angle: 90,
    desc: 'Sales consultant performance tracking',
    scd: 'Type 2',
    cols: ['agent_sk (PK)', 'agent_bk', 'full_name', 'branch_code', 'region', 'specialisation', 'valid_from', 'valid_to'],
    business: 'Which agents drive the highest value? Where should Kuoni invest in training?',
  },
  {
    name: 'DIM_CHANNEL', icon: '📡', color: CRIMSON, angle: 150,
    desc: 'Booking channel — online, store, trade',
    scd: 'Type 0',
    cols: ['channel_sk (PK)', 'channel_name', 'channel_type', 'is_digital', 'sub_channel'],
    business: 'How is the shift from store to digital affecting average booking value and margin?',
  },
]

// ── Data Vault 2.0 Data ───────────────────────────────────────────────────────
const hubs = [
  { name: 'HUB_CUSTOMER', icon: '👥', bk: 'email / CRM ID',
    cols: ['customer_hk (PK)', 'customer_bk', 'load_date', 'record_source'] },
  { name: 'HUB_BOOKING', icon: '✈️', bk: 'booking reference',
    cols: ['booking_hk (PK)', 'booking_bk', 'load_date', 'record_source'] },
  { name: 'HUB_PRODUCT', icon: '🏖️', bk: 'product code',
    cols: ['product_hk (PK)', 'product_bk', 'load_date', 'record_source'] },
  { name: 'HUB_DESTINATION', icon: '🌍', bk: 'IATA / name',
    cols: ['destination_hk (PK)', 'destination_bk', 'load_date', 'record_source'] },
  { name: 'HUB_AGENT', icon: '🧑‍💼', bk: 'employee ID',
    cols: ['agent_hk (PK)', 'agent_bk', 'load_date', 'record_source'] },
]

const links = [
  { name: 'LNK_CUSTOMER\n_BOOKING', cols: ['lnk_hk (PK)', 'customer_hk', 'booking_hk', 'load_date', 'record_source'] },
  { name: 'LNK_BOOKING\n_PRODUCT', cols: ['lnk_hk (PK)', 'booking_hk', 'product_hk', 'load_date', 'record_source'] },
  { name: 'LNK_PRODUCT\n_DESTINATION', cols: ['lnk_hk (PK)', 'product_hk', 'destination_hk', 'load_date', 'record_source'] },
  { name: 'LNK_BOOKING\n_AGENT', cols: ['lnk_hk (PK)', 'booking_hk', 'agent_hk', 'load_date', 'record_source'] },
]

const satellites = [
  { name: 'SAT_CUSTOMER\n_PROFILE', hub: 0,
    cols: ['customer_hk (FK)', 'load_date (PK)', 'load_end_date', 'first_name 🔒', 'last_name 🔒', 'email 🔒', 'segment', 'loyalty_tier', 'hash_diff'] },
  { name: 'SAT_BOOKING\n_FINANCIALS', hub: 1,
    cols: ['booking_hk (FK)', 'load_date (PK)', 'load_end_date', 'total_value_gbp', 'margin_gbp', 'num_passengers', 'status', 'hash_diff'] },
  { name: 'SAT_PRODUCT\n_CATALOGUE', hub: 2,
    cols: ['product_hk (FK)', 'load_date (PK)', 'load_end_date', 'product_name', 'base_price_gbp', 'duration_days', 'all_inclusive', 'hash_diff'] },
  { name: 'SAT_DESTINATION\n_INFO', hub: 3,
    cols: ['destination_hk (FK)', 'load_date (PK)', 'load_end_date', 'destination_name', 'country', 'tier', 'visa_required', 'hash_diff'] },
  { name: 'SAT_AGENT\n_DETAILS', hub: 4,
    cols: ['agent_hk (FK)', 'load_date (PK)', 'load_end_date', 'full_name', 'branch_code', 'specialisation', 'hash_diff'] },
]

// ── Star Schema SVG ───────────────────────────────────────────────────────────
function StarSchemaDiagram({ selected, setSelected }) {
  const cx = 460, cy = 310, r = 210

  return (
    <svg viewBox="0 0 920 620" className="w-full" style={{ maxHeight: 560 }}>
      {/* Connector lines */}
      {dimensions.map((dim, i) => {
        const rad = (dim.angle * Math.PI) / 180
        const x2 = cx + r * Math.cos(rad)
        const y2 = cy + r * Math.sin(rad)
        return (
          <line key={i} x1={cx} y1={cy} x2={x2} y2={y2}
            stroke={selected === dim.name ? dim.color : '#D1D5DB'}
            strokeWidth={selected === dim.name ? 2.5 : 1.5}
            strokeDasharray={selected === dim.name ? 'none' : '6,4'}
            style={{ transition: 'all 0.2s' }} />
        )
      })}

      {/* Dimension boxes */}
      {dimensions.map((dim) => {
        const rad = (dim.angle * Math.PI) / 180
        const bx = cx + r * Math.cos(rad)
        const by = cy + r * Math.sin(rad)
        const bw = 148, bh = 80
        const isSelected = selected === dim.name
        return (
          <g key={dim.name} onClick={() => setSelected(isSelected ? null : dim.name)}
            style={{ cursor: 'pointer' }}>
            <rect x={bx - bw/2} y={by - bh/2} width={bw} height={bh} rx={8}
              fill={isSelected ? dim.color : 'white'}
              stroke={dim.color} strokeWidth={isSelected ? 0 : 2}
              style={{ transition: 'all 0.2s', filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none' }} />
            <rect x={bx - bw/2} y={by - bh/2} width={bw} height={26} rx={8}
              fill={dim.color} />
            <rect x={bx - bw/2} y={by - bh/2 + 18} width={bw} height={8}
              fill={dim.color} />
            <text x={bx} y={by - bh/2 + 17} textAnchor="middle"
              fill="white" fontSize={11} fontWeight="700">{dim.name}</text>
            <text x={bx} y={by - bh/2 + 42} textAnchor="middle"
              fill={isSelected ? 'rgba(255,255,255,0.9)' : '#4B5563'} fontSize={10}>{dim.icon} {dim.scd}</text>
            <text x={bx} y={by - bh/2 + 56} textAnchor="middle"
              fill={isSelected ? 'rgba(255,255,255,0.75)' : '#9CA3AF'} fontSize={8.5}>{dim.cols.length} attributes</text>
            <text x={bx} y={by - bh/2 + 70} textAnchor="middle"
              fill={isSelected ? GOLD : dim.color} fontSize={8.5} fontWeight="600">Click to explore →</text>
          </g>
        )
      })}

      {/* Fact table (centre) */}
      {(() => {
        const bw = 180, bh = 180
        return (
          <g onClick={() => setSelected(selected === 'FCT_BOOKING' ? null : 'FCT_BOOKING')}
            style={{ cursor: 'pointer' }}>
            <rect x={cx - bw/2} y={cy - bh/2} width={bw} height={bh} rx={10}
              fill={TEAL} style={{ filter: 'drop-shadow(0 6px 16px rgba(27,79,107,0.4))' }} />
            <rect x={cx - bw/2} y={cy - bh/2} width={bw} height={36} rx={10} fill={NAVY} />
            <rect x={cx - bw/2} y={cy - bh/2 + 26} width={bw} height={10} fill={NAVY} />
            <text x={cx} y={cy - bh/2 + 14} textAnchor="middle"
              fill="white" fontSize={10} fontWeight="800" letterSpacing="0.5">⭐ FCT_BOOKING</text>
            <text x={cx} y={cy - bh/2 + 28} textAnchor="middle"
              fill={GOLD} fontSize={8.5} fontWeight="600">FACT TABLE · GOLD LAYER</text>
            {['💷 total_value_gbp', '📊 margin_gbp', '👥 num_passengers', '📅 duration_days', '─────────────', '6 × Foreign Keys →', '3 × Degenerate dims'].map((t, i) => (
              <text key={i} x={cx} y={cy - bh/2 + 52 + i * 17} textAnchor="middle"
                fill={t.includes('─') ? 'rgba(255,255,255,0.3)' : t.includes('Foreign') ? GOLD : 'rgba(255,255,255,0.85)'}
                fontSize={8.5} fontWeight={t.includes('Foreign') ? '700' : '400'}>{t}</text>
            ))}
          </g>
        )
      })()}

      {/* Cardinality labels */}
      {dimensions.map((dim) => {
        const rad = (dim.angle * Math.PI) / 180
        const mx = cx + (r * 0.55) * Math.cos(rad)
        const my = cy + (r * 0.55) * Math.sin(rad)
        return (
          <text key={dim.name + '-card'} x={mx} y={my} textAnchor="middle"
            fill={GOLD} fontSize={10} fontWeight="700">N:1</text>
        )
      })}
    </svg>
  )
}

// ── DV2.0 Diagram ─────────────────────────────────────────────────────────────
function DVDiagram({ selected, setSelected }) {
  return (
    <div className="p-4 space-y-3 overflow-x-auto">
      {/* Hubs row */}
      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: NAVY }}>
        🔵 HUBS — Core Business Entities (unique business keys, immutable)
      </div>
      <div className="flex gap-3">
        {hubs.map((hub, i) => (
          <div key={hub.name} onClick={() => setSelected(selected === hub.name ? null : hub.name)}
            className="flex-1 rounded-xl border-2 cursor-pointer transition-all min-w-0"
            style={{ borderColor: NAVY, background: selected === hub.name ? NAVY : 'white', transform: selected === hub.name ? 'translateY(-2px)' : 'none', boxShadow: selected === hub.name ? '0 4px 16px rgba(26,45,85,0.3)' : 'none' }}>
            <div className="text-center py-1.5 rounded-t-xl text-xs font-bold" style={{ background: NAVY }}>
              <span className="mr-1">{hub.icon}</span>
              <span className="text-white">{hub.name.replace('HUB_', '')}</span>
            </div>
            <div className="p-2">
              <div className="text-xs mb-1.5" style={{ color: GOLD }}>BK: {hub.bk}</div>
              {hub.cols.map(c => (
                <div key={c} className="text-xs py-0.5 border-b border-gray-50 last:border-0"
                  style={{ color: selected === hub.name ? 'rgba(255,255,255,0.8)' : c.includes('PK') ? NAVY : '#374151', fontWeight: c.includes('PK') ? 700 : 400 }}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Connectors */}
      <div className="flex justify-around px-8">
        {[0,1,2,3].map(i => (
          <div key={i} className="flex flex-col items-center" style={{ marginLeft: i === 0 ? '10%' : '' }}>
            <div className="w-0.5 h-3" style={{ background: TEAL }} />
            <div className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: TEAL + '20', color: TEAL }}>↕</div>
          </div>
        ))}
      </div>

      {/* Links row */}
      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: TEAL }}>
        🔗 LINKS — Relationships Between Entities (associations, history-preserved)
      </div>
      <div className="flex gap-3 justify-around">
        {links.map((link, i) => (
          <div key={link.name} onClick={() => setSelected(selected === link.name ? null : link.name)}
            className="flex-1 rounded-xl border-2 cursor-pointer transition-all"
            style={{ borderColor: TEAL, background: selected === link.name ? TEAL : 'white', transform: selected === link.name ? 'translateY(-2px)' : 'none' }}>
            <div className="text-center py-1.5 rounded-t-xl text-xs font-bold text-white" style={{ background: TEAL }}>
              {link.name.replace(/\n/g, ' ')}
            </div>
            <div className="p-2">
              {link.cols.map(c => (
                <div key={c} className="text-xs py-0.5 border-b border-gray-50 last:border-0"
                  style={{ color: selected === link.name ? 'rgba(255,255,255,0.8)' : c.includes('PK') ? TEAL : c.includes('FK') || c.includes('hk') ? NAVY : '#6B7280', fontWeight: c.includes('PK') || c.includes('FK') ? 700 : 400 }}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Connectors */}
      <div className="flex justify-around px-4">
        {hubs.map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-0.5 h-3" style={{ background: ORANGE }} />
          </div>
        ))}
      </div>

      {/* Satellites row */}
      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ORANGE }}>
        🛰️ SATELLITES — Descriptive Attributes (full history, hash_diff for change detection)
      </div>
      <div className="flex gap-3">
        {satellites.map((sat, i) => (
          <div key={sat.name} onClick={() => setSelected(selected === sat.name ? null : sat.name)}
            className="flex-1 rounded-xl border-2 cursor-pointer transition-all min-w-0"
            style={{ borderColor: ORANGE, background: selected === sat.name ? ORANGE : 'white', transform: selected === sat.name ? 'translateY(-2px)' : 'none' }}>
            <div className="text-center py-1.5 rounded-t-xl text-xs font-bold text-white" style={{ background: ORANGE }}>
              {sat.name.replace(/\n/g, ' ')}
            </div>
            <div className="p-2">
              {sat.cols.map(c => (
                <div key={c} className="text-xs py-0.5 border-b border-gray-50 last:border-0"
                  style={{ color: selected === sat.name ? 'rgba(255,255,255,0.85)' : c.includes('🔒') ? CRIMSON : c.includes('PK') || c.includes('FK') ? ORANGE : '#374151', fontWeight: c.includes('PK') || c.includes('FK') ? 700 : 400, fontSize: 10 }}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SchemaDesign() {
  const [mode, setMode] = useState('star')
  const [selected, setSelected] = useState(null)

  const selectedDim = dimensions.find(d => d.name === selected)
  const selectedHub = hubs.find(h => h.name === selected)
  const selectedLink = links.find(l => l.name === selected)
  const selectedSat = satellites.find(s => s.name === selected)

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="rounded-xl p-5 mb-6 text-white" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 100%)` }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold mb-1">📐 Data Modelling Architecture</h1>
            <p className="text-white/70 text-sm mb-3">
              Two complementary approaches applied to Kuoni's booking and customer data.
              Data Vault 2.0 for ingestion resilience → Star Schema for reporting performance.
            </p>
            <div className="flex gap-2">
              {[
                { id: 'star', label: '⭐ Star Schema', sub: 'Gold Layer · Power BI optimised' },
                { id: 'dv', label: '🔵 Data Vault 2.0', sub: 'Silver Layer · Audit & agility' },
              ].map(m => (
                <button key={m.id} onClick={() => { setMode(m.id); setSelected(null) }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2"
                  style={{
                    background: mode === m.id ? GOLD : 'transparent',
                    color: mode === m.id ? NAVY : 'white',
                    borderColor: mode === m.id ? GOLD : 'rgba(255,255,255,0.3)',
                  }}>
                  <div>{m.label}</div>
                  <div className="text-xs font-normal opacity-75">{m.sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="text-right text-white/60 text-xs">
            <div className="text-3xl font-bold text-white mb-1">{mode === 'star' ? '6' : '14'}</div>
            <div>{mode === 'star' ? 'Dimension tables' : 'Vault objects'}</div>
            <div className="mt-2 text-2xl font-bold text-white">{mode === 'star' ? '1' : '5'}</div>
            <div>{mode === 'star' ? 'Fact table' : 'Hub entities'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Diagram (left 2/3) */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: TEAL }}>
                {mode === 'star' ? 'Star Schema — Kuoni Dimensional Model' : 'Data Vault 2.0 — Raw Vault'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {mode === 'star' ? 'Click any table to explore columns and business context'
                  : 'Click any object to see columns · 🔒 = PII masked via Dynamic Data Masking'}
              </p>
            </div>
            {selected && (
              <button onClick={() => setSelected(null)} className="text-xs px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-100">✕ Clear</button>
            )}
          </div>
          {mode === 'star'
            ? <StarSchemaDiagram selected={selected} setSelected={setSelected} />
            : <DVDiagram selected={selected} setSelected={setSelected} />
          }
        </div>

        {/* Detail panel (right 1/3) */}
        <div className="space-y-4">
          {/* Selected entity detail */}
          {selectedDim && mode === 'star' && (
            <div className="bg-white rounded-xl shadow-sm border-2 p-5" style={{ borderColor: selectedDim.color }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{selectedDim.icon}</span>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: selectedDim.color }}>{selectedDim.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ background: selectedDim.color }}>SCD {selectedDim.scd}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-3">{selectedDim.desc}</p>
              <div className="space-y-1 mb-3">
                {selectedDim.cols.map(c => (
                  <div key={c} className="flex items-center gap-2 text-xs py-1 border-b border-gray-50 last:border-0">
                    <span style={{ color: c.includes('PK') ? selectedDim.color : c.includes('🔒') ? CRIMSON : '#374151', fontWeight: c.includes('PK') ? 700 : 400 }}>{c}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg p-3 text-xs" style={{ background: selectedDim.color + '12', border: `1px solid ${selectedDim.color}30` }}>
                <p className="font-semibold mb-1" style={{ color: selectedDim.color }}>💼 Business Value</p>
                <p className="text-gray-700">{selectedDim.business}</p>
              </div>
            </div>
          )}

          {!selected && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: TEAL }}>
                {mode === 'star' ? '👆 Click any table to explore' : '👆 Click any object to explore'}
              </h3>
              <div className="space-y-2 text-xs text-gray-600">
                {mode === 'star' ? [
                  '⭐ FCT_BOOKING — every booking transaction with 6 foreign keys and 4 key measures',
                  '👥 DIM_CUSTOMER — SCD Type 2: full history of every customer change',
                  '📅 DIM_DATE — pre-populated calendar with fiscal periods and peak season flags',
                  '🏖️ DIM_PRODUCT — current catalogue of packages (SCD Type 1)',
                  '🌍 DIM_DESTINATION — global destination reference with tier classification',
                  '🧑‍💼 DIM_AGENT — sales consultant history with SCD Type 2',
                  '📡 DIM_CHANNEL — booking channel (online, store, trade)',
                ].map((t, i) => <p key={i} className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0" style={{ color: GOLD }}>→</span>{t}</p>)
                : [
                  '🔵 HUBS store only the unique business key — pure identity, nothing else',
                  '🔗 LINKS record relationships — when did customer X book product Y?',
                  '🛰️ SATELLITES hold descriptive data — everything changes go here, full history',
                  '🔒 PII fields in SAT_CUSTOMER_PROFILE masked via Snowflake Dynamic Data Masking',
                  'hash_diff column detects changes without full row comparison',
                  'load_end_date = NULL means current record — simple current-state query',
                ].map((t, i) => <p key={i} className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0" style={{ color: TEAL }}>→</span>{t}</p>)
                }
              </div>
            </div>
          )}

          {/* Why both? */}
          <div className="rounded-xl p-5 text-white" style={{ background: TEAL }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: GOLD }}>🏗️ Why Both Approaches at Kuoni?</h3>
            <div className="space-y-3 text-xs">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="font-semibold mb-1" style={{ color: GOLD }}>Silver Layer → Data Vault 2.0</p>
                <p className="text-white/80">Booking engines change. Source systems evolve. DV2.0 absorbs schema changes without breaking the pipeline. Full audit trail for GDPR compliance. Right-to-erasure by purging a satellite.</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="font-semibold mb-1" style={{ color: GOLD }}>Gold Layer → Star Schema</p>
                <p className="text-white/80">Power BI needs fast, simple joins. A denormalised star delivers sub-second queries on 8M+ rows. Business users can self-serve without understanding vault complexity.</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="font-semibold mb-1" style={{ color: GOLD }}>The result</p>
                <p className="text-white/80">Resilience at the integration layer. Performance at the consumption layer. Kuoni gets both — this is enterprise-grade data architecture.</p>
              </div>
            </div>
          </div>

          {/* Medallion reminder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: TEAL }}>Where This Fits</p>
            {[
              { layer: '🥉 BRONZE', desc: 'Raw source data, string-typed, append-only', color: '#CD7F32' },
              { layer: '🥈 SILVER', desc: 'Data Vault 2.0 — Hubs, Links, Satellites', color: '#9CA3AF', bold: mode === 'dv' },
              { layer: '🥇 GOLD', desc: 'Star Schema — FCT_BOOKING + 6 Dimensions', color: GOLD, bold: mode === 'star' },
            ].map(l => (
              <div key={l.layer} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0"
                style={{ opacity: l.bold ? 1 : 0.6, transform: l.bold ? 'scale(1.02)' : 'none', transition: 'all 0.2s' }}>
                <span className="text-sm font-bold flex-shrink-0" style={{ color: l.color }}>{l.layer}</span>
                <span className="text-xs text-gray-600">{l.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
