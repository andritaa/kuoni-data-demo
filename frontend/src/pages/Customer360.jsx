import React, { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const BLUE = '#003366'
const GOLD = '#C9A96E'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8010'

const SEGMENT_COLORS = ['#003366', '#C9A96E', '#1d4ed8', '#059669', '#7c3aed', '#ea580c', '#dc2626']

const cardStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}

const fmtCurrency = (v) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v || 0)

const fmtNumber = (v) => new Intl.NumberFormat('en-GB').format(v || 0)

function Customer360() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(`${API}/api/customers/ltv`)
        if (!res.ok) throw new Error(`Failed to load data (${res.status})`)
        const data = await res.json()
        if (active) setCustomers(Array.isArray(data) ? data : [])
      } catch (e) {
        if (active) setError(e.message || 'Unable to fetch customer data')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      [c.customer_name, c.customer_id, c.customer_segment, c.loyalty_tier]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [customers, search])

  const totalCustomers = filtered.length
  const avgLtv =
    filtered.reduce((sum, c) => sum + Number(c.lifetime_value_gbp || 0), 0) / (filtered.length || 1)

  const top10 = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => Number(b.lifetime_value_gbp || 0) - Number(a.lifetime_value_gbp || 0))
        .slice(0, 10),
    [filtered]
  )

  const segmentData = useMemo(() => {
    const map = filtered.reduce((acc, c) => {
      const key = c.customer_segment || 'Unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filtered])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, color: BLUE, fontSize: 28, fontWeight: 700 }}>Customer 360</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>Customer lifetime value, segments, and top accounts</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div style={cardStyle}>
            <div style={{ color: '#64748b', fontSize: 13 }}>Total Customers</div>
            <div style={{ color: BLUE, fontSize: 28, fontWeight: 700, marginTop: 6 }}>{fmtNumber(totalCustomers)}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: '#64748b', fontSize: 13 }}>Average LTV</div>
            <div style={{ color: BLUE, fontSize: 28, fontWeight: 700, marginTop: 6 }}>{fmtCurrency(avgLtv)}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: '#64748b', fontSize: 13 }}>Search</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, ID, segment, tier..."
              style={{
                width: '100%',
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                outline: 'none',
                fontSize: 14,
              }}
            />
          </div>
        </div>

        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', color: '#64748b' }}>Loading customer data...</div>
        )}

        {error && !loading && (
          <div
            style={{
              ...cardStyle,
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
              gap: 16,
              alignItems: 'start',
            }}
          >
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ margin: 0, color: BLUE, fontSize: 18 }}>Top 10 Customers by LTV</h2>
                <span style={{ color: GOLD, fontWeight: 600, fontSize: 13 }}>{fmtNumber(filtered.length)} results</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Customer', 'ID', 'Segment', 'Tier', 'Bookings', 'LTV', 'Avg Booking'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '12px 10px',
                            fontSize: 12,
                            color: '#475569',
                            borderBottom: '1px solid #e5e7eb',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top10.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      top10.map((c, i) => (
                        <tr key={`${c.customer_id}-${i}`}>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: BLUE }}>
                            {c.customer_name || 'Unknown'}
                          </td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                            {c.customer_id || '-'}
                          </td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                            {c.customer_segment || 'Unknown'}
                          </td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: 999,
                                background: '#f3f4f6',
                                color: '#374151',
                                fontSize: 12,
                              }}
                            >
                              {c.loyalty_tier || 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                            {fmtNumber(c.total_bookings)}
                          </td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', color: '#059669', fontWeight: 700 }}>
                            {fmtCurrency(c.lifetime_value_gbp)}
                          </td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                            {fmtCurrency(c.avg_booking_value_gbp)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 12px', color: BLUE, fontSize: 18 }}>Customer Segments</h2>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={45}
                      paddingAngle={2}
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={entry.name} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [fmtNumber(value), name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {segmentData.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: 14 }}>No segment data available.</div>
                ) : (
                  segmentData.map((s, i) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: '#334155', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.name}
                        </span>
                      </div>
                      <span style={{ color: GOLD, fontWeight: 700, fontSize: 14 }}>{fmtNumber(s.value)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .c360-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          h1 { font-size: 24px !important; }
        }
      `}</style>
    </div>
  )
}

export default Customer360