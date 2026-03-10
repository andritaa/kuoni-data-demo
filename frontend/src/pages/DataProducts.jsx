import React, { useState, useEffect } from 'react'

const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'
const NAVY = '#1A2D55'
const GREEN = '#14532D'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8010'

const products = [
  {
    id: 'customer_360',
    name: 'DP_CUSTOMER_360',
    title: 'Customer 360',
    domain: 'Customer',
    icon: '👥',
    color: TEAL,
    owner: 'CRM Team',
    sla: 'GOLD',
    refresh: 'Daily',
    desc: 'Unified customer profile — single source of truth for every Kuoni customer. Combines CRM data, booking history, lifetime value, and segment classification.',
    columns: ['customer_id','segment','loyalty_tier','country','total_bookings','lifetime_value_gbp','avg_booking_value_gbp','last_booking_date','days_since_last_booking','favourite_destination','preferred_channel','retention_status','ltv_band'],
    usedBy: ['CRM dashboards','Personalisation engine','Loyalty programme','Retention campaigns'],
    sources: ['BRONZE.RAW_CUSTOMERS','GOLD.FCT_BOOKING','GOLD.DIM_DESTINATION'],
    query: `SELECT customer_id, segment, loyalty_tier,
       lifetime_value_gbp, ltv_band, retention_status
FROM DATA_PRODUCTS.DP_CUSTOMER_360
WHERE retention_status = 'At Risk'
ORDER BY lifetime_value_gbp DESC
LIMIT 100`,
    sampleMetric: null,
  },
  {
    id: 'booking_intelligence',
    name: 'DP_BOOKING_INTELLIGENCE',
    title: 'Booking Intelligence',
    domain: 'Commercial',
    icon: '✈️',
    color: '#2E6F8F',
    owner: 'Commercial Team',
    sla: 'PLATINUM',
    refresh: 'Daily',
    desc: 'Daily booking grain with full dimensional context — revenue, margin, channel, destination, and agent. Primary product for commercial analytics, Power BI reporting, and demand forecasting.',
    columns: ['booking_reference','booking_status','booking_date','booking_year','booking_month','travel_date','customer_segment','product_name','destination_name','continent','agent_name','channel_name','total_value_gbp','margin_pct','margin_gbp','num_passengers','duration_days'],
    usedBy: ['Power BI dashboards','Revenue reporting','Demand forecasting','Finance reconciliation'],
    sources: ['GOLD.FCT_BOOKING','GOLD.DIM_DATE (×2)','GOLD.DIM_CUSTOMER','GOLD.DIM_PRODUCT','GOLD.DIM_DESTINATION','GOLD.DIM_AGENT','GOLD.DIM_CHANNEL'],
    query: `SELECT booking_month, destination_name,
       SUM(total_value_gbp) AS revenue,
       ROUND(AVG(margin_pct),1) AS avg_margin_pct,
       COUNT(*) AS bookings
FROM DATA_PRODUCTS.DP_BOOKING_INTELLIGENCE
WHERE booking_year = 2025
GROUP BY 1, 2
ORDER BY revenue DESC`,
    sampleMetric: null,
  },
  {
    id: 'destination_performance',
    name: 'DP_DESTINATION_PERFORMANCE',
    title: 'Destination Performance',
    domain: 'Destination',
    icon: '🌍',
    color: '#E86B1A',
    owner: 'Destination Team',
    sla: 'GOLD',
    refresh: 'Daily',
    desc: 'Destination-level commercial performance — revenue, margin, booking volumes, seasonality, and customer mix. Used by product management to optimise the portfolio and by pricing teams.',
    columns: ['destination_name','country','region','continent','tier','year','quarter_name','month_name','is_peak_season','bookings','unique_customers','revenue_gbp','margin_gbp','avg_booking_value','avg_margin_pct','avg_duration_days','cancellation_rate_pct'],
    usedBy: ['Product portfolio reviews','Pricing strategy','Capacity planning','Marketing targeting'],
    sources: ['GOLD.FCT_BOOKING','GOLD.DIM_DESTINATION','GOLD.DIM_DATE'],
    query: `SELECT destination_name, tier, continent,
       SUM(revenue_gbp) AS total_revenue,
       ROUND(AVG(avg_margin_pct),1) AS margin_pct,
       SUM(bookings) AS total_bookings
FROM DATA_PRODUCTS.DP_DESTINATION_PERFORMANCE
WHERE year = 2025
GROUP BY 1, 2, 3
ORDER BY total_revenue DESC`,
    sampleMetric: null,
  },
  {
    id: 'agent_scorecard',
    name: 'DP_AGENT_SCORECARD',
    title: 'Agent Scorecard',
    domain: 'Operations',
    icon: '🧑‍💼',
    color: '#6A0D83',
    owner: 'Operations Team',
    sla: 'GOLD',
    refresh: 'Daily',
    desc: 'Monthly sales consultant performance scorecard — revenue, margin contribution, booking count, and cancellation rate. Used by branch managers for performance reviews and incentive calculations.',
    columns: ['agent_name','branch_code','branch_name','region','specialisation','year','month_name','bookings','revenue_gbp','margin_gbp','avg_booking_value','avg_margin_pct','cancellation_rate_pct','revenue_rank_in_region'],
    usedBy: ['Branch performance reviews','Incentive calculations','Training needs analysis','Workforce planning'],
    sources: ['GOLD.FCT_BOOKING','GOLD.DIM_AGENT','GOLD.DIM_DATE'],
    query: `SELECT agent_name, region, month_name,
       revenue_gbp, avg_margin_pct,
       revenue_rank_in_region
FROM DATA_PRODUCTS.DP_AGENT_SCORECARD
WHERE year = 2025 AND revenue_rank_in_region <= 3
ORDER BY region, month_name, revenue_rank_in_region`,
    sampleMetric: null,
  },
  {
    id: 'executive_kpis',
    name: 'DP_EXECUTIVE_KPIS',
    title: 'Executive KPIs',
    domain: 'Executive',
    icon: '📊',
    color: NAVY,
    owner: 'Data Platform',
    sla: 'PLATINUM',
    refresh: 'Daily',
    desc: 'Monthly executive KPI roll-up — revenue, margin, bookings, and YoY growth. Single authoritative source for board reporting, CIO dashboards, and DERTOUR Group submissions.',
    columns: ['year','month_name','quarter_name','revenue_gbp','margin_gbp','bookings','unique_customers','avg_booking_value_gbp','avg_margin_pct','cancellation_rate_pct','revenue_gbp_prior_year','revenue_yoy_pct'],
    usedBy: ['Board reporting','CIO dashboard','DERTOUR Group submissions','Investor relations'],
    sources: ['GOLD.FCT_BOOKING','GOLD.DIM_DATE'],
    query: `SELECT year, month_name, revenue_gbp,
       margin_gbp, bookings,
       revenue_yoy_pct AS yoy_growth_pct
FROM DATA_PRODUCTS.DP_EXECUTIVE_KPIS
ORDER BY year, month_num`,
    sampleMetric: null,
  },
]

const slaBadge = { PLATINUM: { bg:'#FEF3C7', text:'#92400E', label:'⭐ PLATINUM' }, GOLD: { bg:'#EBF4F8', text:TEAL, label:'🥇 GOLD' }, SILVER: { bg:'#F3F4F6', text:'#6B7280', label:'🥈 SILVER' } }

// ── Brand colour map ──
const BRAND_COLORS = {
  KUONI_UK:  { primary: TEAL,      flag: '🇬🇧', bg: '#EBF4F8' },
  KUONI_FR:  { primary: '#1A237E', flag: '🇫🇷', bg: '#E8EAF6' },
  APOLLO:    { primary: '#0277BD', flag: '🇸🇪', bg: '#E1F5FE' },
  PRIJSVRIJ: { primary: '#E65100', flag: '🇳🇱', bg: '#FFF3E0' },
  DREIZEN:   { primary: '#880E4F', flag: '🇧🇪', bg: '#FCE4EC' },
}

function fmt(n) { return n ? `£${(n / 1_000_000).toFixed(1)}M` : '—' }
function fmtK(n) { return n ? Number(n).toLocaleString() : '—' }
function fmtAvg(n) { return n ? `£${Math.round(n).toLocaleString()}` : '—' }

function BrandMeshSection() {
  const [brands, setBrands] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [view, setView] = useState('grid') // grid | mesh

  useEffect(() => {
    fetch(`${API}/api/brands/rollup`)
      .then(r => r.json())
      .then(d => {
        setBrands(d.brands || d)
        setSelectedBrand((d.brands || d)[0]?.brand_id || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const groupRevenue = brands ? brands.reduce((s, b) => s + (b.total_revenue_gbp || 0), 0) : 0

  return (
    <div style={{ marginTop: 48 }}>
      {/* Section header */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0D2B38 100%)`, borderRadius: 16, padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>DERTOUR GROUP · DATA MESH</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>Northern Europe — Brand Data Domains</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
              In a data mesh architecture, each brand owns its data domain. Kuoni UK, Kuoni France, Apollo, Prijsvrij Vakanties and D-reizen each publish governed data products consumed by the brand, by DERTOUR Northern Europe leadership, and by DERTOUR Group's central reporting layer.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              ['5', 'Brand Domains'],
              ['3', 'Data Products'],
              ['1', 'Group Rollup'],
            ].map(([n, l]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{n}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data mesh flow diagram */}
      <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Data Mesh Flow — DERTOUR Northern Europe</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Source brand domains */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['🇬🇧 Kuoni UK', '🇫🇷 Kuoni France', '🇸🇪 Apollo', '🇳🇱 Prijsvrij', '🇧🇪 D-reizen'].map(b => (
              <div key={b} style={{ background: '#F3F4F6', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: TEAL }}>{b}</div>
            ))}
          </div>
          <div style={{ fontSize: 18, color: '#D1D5DB', padding: '0 4px' }}>→</div>
          {/* Brand data products */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['DP_BRAND_PERFORMANCE', 'DP_BRAND_ROLLUP', 'DP_BRAND_DESTINATION_MIX'].map(p => (
              <div key={p} style={{ background: TEAL + '15', border: `1px solid ${TEAL}30`, borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: TEAL, fontFamily: 'monospace' }}>{p}</div>
            ))}
          </div>
          <div style={{ fontSize: 18, color: '#D1D5DB', padding: '0 4px' }}>→</div>
          {/* Consumers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['Northern Europe Leadership', 'DERTOUR Group Board', 'Boris Raoul · Group CTO'].map(c => (
              <div key={c} style={{ background: GOLD + '20', border: `1px solid ${GOLD}40`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#92400E' }}>{c}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Brand cards — live from Snowflake */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading from Snowflake…</div>
      ) : brands ? (
        <>
          {/* Group totals bar */}
          <div style={{ background: NAVY, borderRadius: 12, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Group Total (Northern Europe)</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{fmt(groupRevenue)}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>across {brands.length} brands · {fmtK(brands.reduce((s, b) => s + (b.total_bookings || 0), 0))} bookings · {fmtK(brands.reduce((s, b) => s + (b.total_customers || 0), 0))} customers</div>
            <div style={{ marginLeft: 'auto', background: GOLD + '25', border: `1px solid ${GOLD}50`, borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 800, color: GOLD }}>❄️ LIVE SNOWFLAKE</div>
          </div>

          {/* Revenue share bar */}
          <div style={{ background: 'white', borderRadius: 12, padding: '14px 20px', marginBottom: 20, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>Revenue Distribution Across Brands</div>
            <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              {brands.map(b => {
                const bc = BRAND_COLORS[b.brand_id] || { primary: TEAL }
                const sharePct = groupRevenue > 0 ? (b.total_revenue_gbp / groupRevenue * 100) : b.revenue_share_pct
                return (
                  <div key={b.brand_id} title={`${b.brand_name}: ${sharePct.toFixed(1)}%`}
                    style={{ flex: sharePct, background: bc.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', minWidth: 30, cursor: 'pointer' }}
                    onClick={() => setSelectedBrand(b.brand_id)}>
                    {sharePct > 8 ? `${sharePct.toFixed(0)}%` : ''}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {brands.map(b => {
                const bc = BRAND_COLORS[b.brand_id] || { primary: TEAL }
                return (
                  <div key={b.brand_id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: bc.primary, flexShrink: 0 }} />
                    <span style={{ color: '#374151' }}>{bc.flag} {b.brand_name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Brand detail cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
            {brands.map(b => {
              const bc = BRAND_COLORS[b.brand_id] || { primary: TEAL, flag: '🌍', bg: '#F3F4F6' }
              const isSelected = selectedBrand === b.brand_id
              return (
                <div key={b.brand_id}
                  onClick={() => setSelectedBrand(b.brand_id)}
                  style={{ background: 'white', borderRadius: 12, border: `2px solid ${isSelected ? bc.primary : '#E5E7EB'}`, padding: 20, cursor: 'pointer', transition: 'all 0.15s', boxShadow: isSelected ? `0 6px 20px ${bc.primary}22` : '0 2px 8px rgba(0,0,0,0.05)', transform: isSelected ? 'translateY(-2px)' : 'none' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ fontSize: 26 }}>{bc.flag}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: bc.primary }}>{b.brand_name}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{b.brand_type} · {b.market}</div>
                    </div>
                    <div style={{ background: bc.bg, border: `1px solid ${bc.primary}30`, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: bc.primary, textTransform: 'uppercase' }}>
                      {b.brand_currency}
                    </div>
                  </div>
                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
                    {[
                      ['💷 Revenue (GBP)', fmt(b.total_revenue_gbp)],
                      ['✈️ Bookings', fmtK(b.total_bookings)],
                      ['👥 Customers', fmtK(b.total_customers)],
                      ['📊 Avg Booking', fmtAvg(b.avg_booking_value_gbp)],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: '#F8F9FA', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEAL }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Group share bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>
                      <span>Group Revenue Share</span>
                      <span style={{ fontWeight: 700, color: bc.primary }}>
                        {groupRevenue > 0 ? (b.total_revenue_gbp / groupRevenue * 100).toFixed(1) : b.revenue_share_pct}%
                      </span>
                    </div>
                    <div style={{ height: 5, background: '#E5E7EB', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${groupRevenue > 0 ? (b.total_revenue_gbp / groupRevenue * 100) : b.revenue_share_pct}%`, background: bc.primary, borderRadius: 3 }} />
                    </div>
                  </div>
                  {/* Data product tags */}
                  <div style={{ display: 'flex', gap: 5, marginTop: 12, flexWrap: 'wrap' }}>
                    {['DP_BRAND_PERFORMANCE', 'DP_BRAND_ROLLUP', 'DP_BRAND_DESTINATION_MIX'].map(p => (
                      <span key={p} style={{ background: bc.bg, border: `1px solid ${bc.primary}25`, borderRadius: 12, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: bc.primary, fontFamily: 'monospace' }}>{p}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Data mesh rationale */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { icon: '🏛️', title: 'Why Data Mesh?', color: TEAL,
                text: 'Each brand has distinct market context, currency, booking patterns, and customer behaviour. A centralised model forces compromise. Mesh gives each brand domain autonomy while enabling group-level consolidation.' },
              { icon: '📊', title: 'Group Reporting', color: NAVY,
                text: 'DP_BRAND_ROLLUP produces a single GBP-equivalent view across all 5 brands — what Leif Vase Larsen (CEO Northern Europe) and Boris Raoul (Group CTO) need for portfolio decisions.' },
              { icon: '🎯', title: 'Personalisation Signal', color: '#14532D',
                text: 'DP_BRAND_DESTINATION_MIX reveals cross-brand destination intelligence — Apollo customers who love Maldives are Kuoni premium prospects. The mesh makes this signal visible.' },
            ].map(({ icon, title, color, text }) => (
              <div key={title} style={{ background: 'white', borderRadius: 12, padding: 20, borderTop: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{text}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Brand data unavailable</div>
      )}
    </div>
  )
}

function ProductCard({ p, selected, onClick }) {
  const sla = slaBadge[p.sla]
  return (
    <div onClick={onClick} className="bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg p-5"
      style={{ borderColor: selected ? p.color : '#E5E7EB', transform: selected ? 'translateY(-2px)' : 'none', boxShadow: selected ? `0 8px 24px ${p.color}25` : '' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: p.color + '15' }}>
            {p.icon}
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: p.color }}>{p.title}</h3>
            <p className="text-xs text-gray-400">{p.domain} Domain</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sla.bg, color: sla.text }}>{sla.label}</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed mb-3">{p.desc}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">👤 {p.owner}</span>
        <span className="font-medium" style={{ color: p.color }}>🔄 {p.refresh}</span>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-50 font-mono text-xs text-gray-400">{p.name}</div>
    </div>
  )
}

export default function DataProducts() {
  const [selected, setSelected] = useState('booking_intelligence')
  const [tab, setTab] = useState('overview')
  const p = products.find(x => x.id === selected)

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="rounded-xl p-6 mb-6 text-white" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 100%)` }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold mb-1">📦 Data Mesh — Data Products Catalogue</h1>
            <p className="text-white/70 text-sm mb-3">Domain-owned, governed, discoverable data products. Each product is a secure view in Snowflake with SLA guarantees, ownership tags, and lineage tracked via Snowflake Horizon.</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {['Commercial','Customer','Destination','Operations','Executive'].map(d => (
                <span key={d} className="px-2 py-1 rounded-full bg-white/15">{d} Domain</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            {[['5','Data Products'],['4','Domains'],['2','SLA Tiers'],['5','Gov Tags']].map(([n,l]) => (
              <div key={l} className="bg-white/10 rounded-xl px-4 py-2">
                <div className="text-2xl font-bold" style={{ color: GOLD }}>{n}</div>
                <div className="text-xs text-white/60">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture banner */}
      <div className="rounded-xl p-4 mb-6 flex items-center gap-6 flex-wrap" style={{ background: '#F8F6F3', border: '1px solid #E5E7EB' }}>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Mesh Architecture</span>
        {[
          ['🥉 BRONZE','Raw Sources','#CD7F32'],
          ['→','','#D1D5DB'],
          ['🥈 SILVER','Data Vault 2.0','#9CA3AF'],
          ['→','','#D1D5DB'],
          ['🥇 GOLD','Star Schema','#C9A96E'],
          ['→','','#D1D5DB'],
          ['📦 DATA PRODUCTS','Domain APIs','#1B4F6B'],
          ['→','','#D1D5DB'],
          ['📊 CONSUMERS','Power BI · Apps · AI','#27AE60'],
        ].map(([label, sub, color], i) => label === '→'
          ? <span key={i} className="text-gray-300 text-lg">→</span>
          : (
            <div key={i} className="text-center">
              <div className="text-xs font-bold" style={{ color }}>{label}</div>
              {sub && <div className="text-xs text-gray-400">{sub}</div>}
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Product grid */}
        <div className="xl:col-span-1 space-y-3">
          {products.map(pr => (
            <ProductCard key={pr.id} p={pr} selected={selected === pr.id} onClick={() => { setSelected(pr.id); setTab('overview') }} />
          ))}
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Product header */}
            <div className="p-5 text-white" style={{ background: p.color }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <h2 className="text-lg font-bold">{p.title}</h2>
                  <p className="text-white/70 text-sm font-mono">{p.name}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-white/20">{p.domain} Domain</span>
                  <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: GOLD + '30', color: GOLD }}>{p.sla}</span>
                </div>
              </div>
              <p className="text-white/80 text-sm">{p.desc}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {[['overview','📋 Overview'],['columns','🗂 Columns'],['lineage','🔗 Lineage'],['query','💻 Sample Query']].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  className="px-5 py-3 text-xs font-semibold transition-all border-b-2"
                  style={{ borderColor: tab === id ? p.color : 'transparent', color: tab === id ? p.color : '#6B7280' }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === 'overview' && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: TEAL }}>Governance</h4>
                    <div className="space-y-2">
                      {[
                        ['TAG: DOMAIN', p.domain],
                        ['TAG: DATA_STEWARD', p.owner],
                        ['TAG: SLA_TIER', p.sla],
                        ['TAG: REFRESH_CADENCE', p.refresh],
                        ['TAG: DATA_PRODUCT', 'TRUE'],
                        ['Schema', 'KUONI_DEMO.DATA_PRODUCTS'],
                        ['Type', 'SECURE VIEW'],
                        ['PII Masked', 'Yes — Dynamic Data Masking'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                          <span className="text-xs font-mono text-gray-400">{k}</span>
                          <span className="text-xs font-semibold" style={{ color: TEAL }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: TEAL }}>Consumed By</h4>
                    <div className="space-y-2 mb-5">
                      {p.usedBy.map(u => (
                        <div key={u} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                          <span style={{ color: GOLD }}>→</span>
                          <span className="text-xs text-gray-700">{u}</span>
                        </div>
                      ))}
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: TEAL }}>SLA Definition</h4>
                    <div className="rounded-lg p-3 text-xs" style={{ background: p.color + '10', border: `1px solid ${p.color}20` }}>
                      {p.sla === 'PLATINUM'
                        ? '⭐ PLATINUM — 99.9% availability, refreshed daily by 06:00 GMT, < 5 min query SLA, alerting on failure within 10 min'
                        : '🥇 GOLD — 99.5% availability, refreshed daily by 08:00 GMT, < 30 min query SLA, failure alert within 1 hour'}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'columns' && (
                <div>
                  <p className="text-xs text-gray-400 mb-3">{p.columns.length} columns — all typed, documented, and accessible via Snowsight Data Explorer</p>
                  <div className="grid grid-cols-2 gap-1">
                    {p.columns.map((col, i) => (
                      <div key={col} className="flex items-center gap-2 py-1.5 px-2 rounded text-xs" style={{ background: i % 2 === 0 ? '#F8F9FA' : 'white' }}>
                        <span className="text-gray-300 text-xs w-4">{i + 1}</span>
                        <span className="font-mono font-medium text-gray-700">{col}</span>
                        {col.includes('_gbp') && <span className="text-xs text-green-600 ml-auto">£</span>}
                        {col.includes('_pct') && <span className="text-xs text-blue-500 ml-auto">%</span>}
                        {col.includes('_date') && <span className="text-xs text-purple-500 ml-auto">📅</span>}
                        {col.includes('id') && <span className="text-xs text-orange-400 ml-auto">🔑</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'lineage' && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: TEAL }}>Data Lineage — Source to Product</h4>
                  <div className="flex flex-wrap gap-2 items-center mb-6">
                    {p.sources.map((src, i) => (
                      <React.Fragment key={src}>
                        <div className="rounded-lg px-3 py-2 text-xs font-mono font-semibold text-white"
                          style={{ background: src.includes('BRONZE') ? '#CD7F32' : src.includes('GOLD') ? GOLD : TEAL }}>
                          {src}
                        </div>
                        {i < p.sources.length - 1 && <span className="text-gray-300">→</span>}
                      </React.Fragment>
                    ))}
                    <span className="text-gray-300">→</span>
                    <div className="rounded-lg px-3 py-2 text-xs font-mono font-semibold text-white" style={{ background: NAVY }}>
                      DATA_PRODUCTS.{p.name}
                    </div>
                  </div>
                  <div className="rounded-xl p-4 text-sm" style={{ background: '#F8F6F3', border: '1px solid #E5E7EB' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: TEAL }}>Transformation Logic</p>
                    <p className="text-xs text-gray-600">
                      Reads from the Gold Star Schema layer via a <strong>SECURE VIEW</strong> — no data duplication, zero storage cost.
                      Snowflake evaluates the view at query time using the warehouse attached to the consuming role.
                      PII fields are masked via Dynamic Data Masking policies applied at the column level.
                      The view is refreshed automatically as new data loads into the underlying fact and dimension tables.
                    </p>
                  </div>
                </div>
              )}

              {tab === 'query' && (
                <div>
                  <p className="text-xs text-gray-400 mb-3">Run this in Snowsight — <span className="font-mono">USE DATABASE KUONI_DEMO;</span></p>
                  <pre className="rounded-xl p-4 text-xs text-green-300 overflow-auto" style={{ background: '#0D1117', maxHeight: 300, fontFamily: 'monospace' }}>
                    <code>{p.query}</code>
                  </pre>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      ['Zero Copy', 'Secure view — no data duplication, instant refresh'],
                      ['Governed', 'SECURE VIEW + tags — only authorised roles can access'],
                      ['Discoverable', 'Tagged and documented in Snowsight Data Explorer'],
                    ].map(([title, desc]) => (
                      <div key={title} className="rounded-lg p-3 text-xs" style={{ background: TEAL + '10', border: `1px solid ${TEAL}20` }}>
                        <p className="font-bold mb-1" style={{ color: TEAL }}>{title}</p>
                        <p className="text-gray-600">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── DERTOUR GROUP BRAND MESH ── */}
      <BrandMeshSection />
    </main>
  )
}
