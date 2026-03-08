import React, { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8010'
const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'
const COLORS = [TEAL, GOLD, '#2E6F8F', '#8B4513', '#4A7C9B', '#D4A84B', '#1A3A4A', '#E8C47A']
const fmt = (n) => n >= 1_000_000 ? `£${(n/1_000_000).toFixed(1)}M` : `£${Number(n||0).toLocaleString('en-GB',{maximumFractionDigits:0})}`

function KPICard({ label, value, sub, icon }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{color:GOLD}}>{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold mb-1" style={{color:TEAL}}>{value}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  )
}

export default function Dashboard() {
  const [kpi, setKpi] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [destinations, setDestinations] = useState([])
  const [segments, setSegments] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/overview`).then(x=>x.json()),
      fetch(`${API}/api/revenue/monthly`).then(x=>x.json()),
      fetch(`${API}/api/destinations/top`).then(x=>x.json()),
      fetch(`${API}/api/customers/segments`).then(x=>x.json()),
      fetch(`${API}/api/products/top`).then(x=>x.json()),
    ]).then(([k,r,d,s,p]) => { setKpi(k);setRevenue(r);setDestinations(d);setSegments(s);setProducts(p) })
    .catch(console.error).finally(()=>setLoading(false))
  }, [])

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="rounded-xl p-3 mb-6 flex flex-wrap gap-2 items-center" style={{background:'#EBF4F8',border:'1px solid #B8D4E0'}}>
        <span className="text-xs font-semibold" style={{color:TEAL}}>Medallion Architecture:</span>
        {[['🥉 BRONZE','Raw Landing'],['🥈 SILVER','Cleansed & Typed'],['🥇 GOLD','Analytics Views']].map(([l,d])=>(
          <div key={l} className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg shadow-sm text-xs"><b>{l}</b><span className="text-gray-500">— {d}</span></div>
        ))}
        <span className="text-xs text-gray-400 ml-auto">❄️ Snowflake · AWS eu-west-2 · 30,270 rows</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard label="Total Revenue" icon="💷" value={loading?'…':fmt(kpi?.total_revenue_gbp)} sub="3-year portfolio" />
        <KPICard label="Total Bookings" icon="✈️" value={loading?'…':(kpi?.total_bookings||0).toLocaleString()} sub="Confirmed + Completed" />
        <KPICard label="Avg Booking Value" icon="📈" value={loading?'…':fmt(kpi?.avg_booking_value_gbp)} sub="Per transaction" />
        <KPICard label="Active Customers" icon="👥" value={loading?'…':(kpi?.total_customers||0).toLocaleString()} sub={`${(kpi?.cancellation_rate_pct||0).toFixed(1)}% cancellation rate`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{color:TEAL}}>Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenue} margin={{top:5,right:10,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/>
              <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v?.slice(2,7)||''}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`£${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={(v)=>[fmt(v),'Revenue']} labelFormatter={l=>l?.slice(0,7)||''}/>
              <Line type="monotone" dataKey="revenue_gbp" stroke={TEAL} strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{color:TEAL}}>Top Destinations by Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={destinations.slice(0,8)} layout="vertical" margin={{top:5,right:20,left:70,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/>
              <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>`£${(v/1000).toFixed(0)}k`}/>
              <YAxis type="category" dataKey="destination_name" tick={{fontSize:10}} width={90}/>
              <Tooltip formatter={(v)=>[fmt(v),'Revenue']}/>
              <Bar dataKey="total_revenue_gbp" fill={TEAL} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{color:TEAL}}>Customer Segments</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie data={segments} dataKey="customer_count" cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                  {segments.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={(v,n)=>[v.toLocaleString(),n]}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {segments.map((s,i)=>(
                <div key={s.segment} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                  <div><p className="text-xs font-semibold">{s.segment}</p><p className="text-xs text-gray-500">{s.customer_count?.toLocaleString()} · {fmt(s.avg_ltv||0)} LTV</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{color:TEAL}}>Top Holiday Packages</h3>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-52">
            {products.slice(0,7).map((p,i)=>(
              <div key={p.product_id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300">#{i+1}</span>
                  <div><p className="text-xs font-semibold leading-tight">{p.product_name?.slice(0,32)}{p.product_name?.length>32?'…':''}</p><p className="text-xs text-gray-500">{p.destination_name} · {p.product_type}</p></div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className="text-xs font-bold" style={{color:TEAL}}>{fmt(p.total_revenue_gbp||0)}</p>
                  <p className="text-xs text-gray-500">{p.total_bookings} bkgs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
