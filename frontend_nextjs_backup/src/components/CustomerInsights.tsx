'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface SegmentData {
  segment: string
  customer_count: number
  avg_spend_gbp: number
  total_spend_gbp: number
  avg_bookings: number
}

const COLORS: Record<string, string> = {
  'Luxury':   '#1B4F6B',
  'Premium':  '#C9A96E',
  'Explorer': '#2A6A8F',
}

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-1" style={{ color: COLORS[d.segment] }}>{d.segment}</p>
      <p className="text-gray-700">Customers: <strong>{d.customer_count?.toLocaleString()}</strong></p>
      <p className="text-gray-500">Avg spend: <strong>£{d.avg_spend_gbp?.toLocaleString()}</strong></p>
      <p className="text-gray-500">Avg bookings: <strong>{d.avg_bookings}</strong></p>
    </div>
  )
}

export default function CustomerInsights({ data }: { data: SegmentData[] }) {
  const totalCustomers = data.reduce((s, d) => s + d.customer_count, 0)
  const totalValue = data.reduce((s, d) => s + d.total_spend_gbp, 0)

  return (
    <div className="chart-card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#1B4F6B]">Customer Segments</h2>
        <p className="text-sm text-gray-500 mt-0.5">{totalCustomers.toLocaleString()} active customers</p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            dataKey="customer_count"
            nameKey="segment"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORS[entry.segment] || '#999'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-xs text-gray-700">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Segment table */}
      <div className="mt-4 space-y-2">
        {data.map(seg => (
          <div key={seg.segment} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[seg.segment] }} />
              <span className="text-gray-700 font-medium">{seg.segment}</span>
            </div>
            <div className="flex gap-6 text-gray-500 text-xs">
              <span>{seg.customer_count} customers</span>
              <span className="font-semibold text-gray-700">£{(seg.total_spend_gbp / 1_000_000).toFixed(1)}M total</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
