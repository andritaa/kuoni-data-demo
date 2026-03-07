'use client'
import { useEffect, useState } from 'react'
import KuoniHeader from '../components/KuoniHeader'
import RevenueChart from '../components/RevenueChart'
import TopDestinations from '../components/TopDestinations'
import CustomerInsights from '../components/CustomerInsights'
import BookingTrends from '../components/BookingTrends'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'

interface KPI {
  total_bookings: number
  total_revenue_gbp: number
  avg_booking_value_gbp: number
  total_customers: number
  cancellation_rate_pct: number
  data_source: string
}

export default function Home() {
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/overview`)
      .then(r => r.json())
      .then(d => { setKpi(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const fmt = (n: number) => n >= 1_000_000
    ? `£${(n / 1_000_000).toFixed(1)}M`
    : `£${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`

  return (
    <div className="min-h-screen" style={{ background: '#F8F6F3' }}>
      <KuoniHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue', value: loading ? '…' : fmt(kpi?.total_revenue_gbp || 0), sub: '3-year portfolio' },
            { label: 'Total Bookings', value: loading ? '…' : (kpi?.total_bookings || 0).toLocaleString(), sub: 'Confirmed + Completed' },
            { label: 'Avg Booking Value', value: loading ? '…' : fmt(kpi?.avg_booking_value_gbp || 0), sub: 'Per transaction' },
            { label: 'Active Customers', value: loading ? '…' : (kpi?.total_customers || 0).toLocaleString(), sub: `${(kpi?.cancellation_rate_pct || 0).toFixed(1)}% cancellation rate` },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#C9A96E' }}>{card.label}</p>
              <p className="text-2xl font-bold mb-1" style={{ color: '#1B4F6B' }}>{card.value}</p>
              <p className="text-xs text-gray-500">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#1B4F6B' }}>Revenue Trend</h2>
            <RevenueChart apiUrl={API} />
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#1B4F6B' }}>Top Destinations</h2>
            <TopDestinations apiUrl={API} />
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#1B4F6B' }}>Customer Segments</h2>
            <CustomerInsights apiUrl={API} />
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#1B4F6B' }}>Booking Trends</h2>
            <BookingTrends apiUrl={API} />
          </div>
        </div>

        {/* Architecture callout */}
        <div className="rounded-xl p-6 border" style={{ background: '#1B4F6B', borderColor: '#1B4F6B' }}>
          <div className="flex items-start gap-4">
            <div className="text-3xl">🏔️</div>
            <div>
              <h3 className="text-white font-bold mb-2">Medallion Architecture — Snowflake Data Platform</h3>
              <div className="flex flex-wrap gap-3 text-sm">
                {[
                  { layer: 'BRONZE', desc: 'Raw landing — immutable source data', color: '#CD7F32' },
                  { layer: 'SILVER', desc: 'Cleansed, conformed, typed', color: '#C0C0C0' },
                  { layer: 'GOLD', desc: 'Analytics-ready business views', color: '#C9A96E' },
                ].map(l => (
                  <div key={l.layer} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <span className="font-bold" style={{ color: l.color }}>{l.layer}</span>
                    <span className="text-white/80">{l.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-white/60 text-xs mt-3">Powered by Snowflake · AWS eu-west-2 (London) · 30,270 rows loaded</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
