import React, { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8010'

const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'
const TEAL_LIGHT = '#2E6F8F'
const COLORS = [TEAL, GOLD, '#2E6F8F', '#8B4513', '#4A7C9B', '#D4A84B', '#1A3A4A', '#E8C47A']

const fmt = (n) => n >= 1_000_000 ? `£${(n/1_000_000).toFixed(1)}M` : `£${Number(n).toLocaleString('en-GB', {maximumFractionDigits:0})}`

function KPICard({ label, value, sub, icon }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{color: GOLD}}>{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold mb-1" style={{color: TEAL}}>{value}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{color: TEAL}}>{children}</h2>
}

export default function App() {
  const [kpi, setKpi] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [destinations, setDestinations] = useState([])
  const [segments, setSegments] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [k, r, d, s, p] = await Promise.all([
          fetch(`${API}/api/overview`).then(x=>x.json()),
          fetch(`${API}/api/revenue/monthly`).then(x=>x.json()),
          fetch(`${API}/api/destinations/top`).then(x=>x.json()),
          fetch(`${API}/api/customers/segments`).then(x=>x.json()),
          fetch(`${API}/api/products/top`).then(x=>x.json()),
        ])
        setKpi(k); setRevenue(r); setDestinations(d); setSegments(s); setProducts(p)
      } catch(e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen" style={{background:'#F8F6F3'}}>
      {/* Header */}
      <header style={{background: TEAL}} className="shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold tracking-wide">KUONI</h1>
            <p className="text-xs mt-0.5" style={{color: GOLD}}>Data Intelligence Platform</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-white text-xs font-medium">Powered by</p>
              <p className="text-xs font-bold" style={{color: GOLD}}>❄️ Snowflake</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{background: GOLD, color: TEAL}}>
              LIVE DATA
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Architecture Banner */}
        <div className="rounded-xl p-4 mb-8 flex flex-wrap gap-3 items-center" style={{background: '#EBF4F8', border: `1px solid #B8D4E0`}}>
          <span className="text-xs font-semibold" style={{color: TEAL}}>Architecture:</span>
          {[['🥉 BRONZE','Raw Landing'],['🥈 SILVER','Cleansed & Typed'],['🥇 GOLD','Analytics Views']].map(([layer, desc]) => (
            <div key={layer} className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-xs font-bold">{layer}</span>
              <span className="text-xs text-gray-500">— {desc}</span>
            </div>
          ))}
          <span className="text-xs text-gray-500 ml-auto">AWS eu-west-2 · London · 30,270 rows</span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard label="Total Revenue" icon="💷"
            value={loading ? '…' : fmt(kpi?.total_revenue_gbp || 0)}
            sub="3-year portfolio" />
          <KPICard label="Total Bookings" icon="✈️"
            value={loading ? '…' : (kpi?.total_bookings || 0).toLocaleString()}
            sub="Confirmed + Completed" />
          <KPICard label="Avg Booking Value" icon="📈"
            value={loading ? '…' : fmt(kpi?.avg_booking_value_gbp || 0)}
            sub="Per transaction" />
          <KPICard label="Active Customers" icon="👥"
            value={loading ? '…' : (kpi?.total_customers || 0).toLocaleString()}
            sub={`${(kpi?.cancellation_rate_pct || 0).toFixed(1)}% cancellation rate`} />
        </div>

        {/* Revenue + Destinations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <SectionTitle>Monthly Revenue Trend (GBP)</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenue} margin={{top:5,right:10,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v?.slice(0,7)||''} />
                <YAxis tick={{fontSize:10}} tickFormatter={v=>`£${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v)=>[fmt(v),'Revenue']} labelFormatter={l=>l?.slice(0,7)||''} />
                <Line type="monotone" dataKey="revenue_gbp" stroke={TEAL} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <SectionTitle>Top Destinations by Revenue</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={destinations.slice(0,8)} layout="vertical" margin={{top:5,right:20,left:60,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>`£${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="destination_name" tick={{fontSize:10}} width={80} />
                <Tooltip formatter={(v)=>[fmt(v),'Revenue']} />
                <Bar dataKey="total_revenue_gbp" fill={TEAL} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segments + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <SectionTitle>Customer Segments</SectionTitle>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={segments} dataKey="customer_count" nameKey="segment" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {segments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v,n)=>[v.toLocaleString(),n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {segments.map((s, i) => (
                  <div key={s.segment} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{background: COLORS[i % COLORS.length]}} />
                    <div>
                      <p className="text-xs font-semibold">{s.segment}</p>
                      <p className="text-xs text-gray-500">{s.customer_count?.toLocaleString()} · {fmt(s.avg_ltv || 0)} LTV</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <SectionTitle>Top Holiday Packages</SectionTitle>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-52">
              {products.slice(0,8).map((p, i) => (
                <div key={p.product_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">#{i+1}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{p.product_name?.slice(0,35)}{p.product_name?.length > 35 ? '…' : ''}</p>
                      <p className="text-xs text-gray-500">{p.destination_name} · {p.product_type}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs font-bold" style={{color: TEAL}}>{fmt(p.total_revenue_gbp || 0)}</p>
                    <p className="text-xs text-gray-500">{p.total_bookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Model callout */}
        <div className="rounded-xl p-6 text-white" style={{background: TEAL}}>
          <h3 className="font-bold text-lg mb-3">📐 Data Architecture Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="font-semibold mb-2" style={{color: '#CD7F32'}}>🥉 BRONZE — Raw Landing</p>
              <p className="text-white/80 text-xs">Immutable source records. No transformations. Full audit trail. Tables: RAW_BOOKINGS, RAW_CUSTOMERS, RAW_PRODUCTS, RAW_DESTINATIONS, RAW_INTERACTIONS</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="font-semibold mb-2" style={{color: '#C0C0C0'}}>🥈 SILVER — Conformed Layer</p>
              <p className="text-white/80 text-xs">Type-cast, deduplicated, standardised. dbt-managed. FCT_BOOKING, DIM_CUSTOMER, DIM_DESTINATION, DIM_PRODUCT, DIM_DATE</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="font-semibold mb-2" style={{color: GOLD}}>🥇 GOLD — Analytics Ready</p>
              <p className="text-white/80 text-xs">Business-facing views. Aggregated, joined, KPI-ready. RPT_REVENUE_BY_DESTINATION, RPT_CUSTOMER_LTV, RPT_BOOKING_FUNNEL</p>
            </div>
          </div>
          <p className="text-white/50 text-xs mt-4">Snowflake · AWS eu-west-2 (London) · dbt transformations · 30,270 rows loaded · Interview demo — DERTOUR/Kuoni</p>
        </div>
      </main>
    </div>
  )
}
