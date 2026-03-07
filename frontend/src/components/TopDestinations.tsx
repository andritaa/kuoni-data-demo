'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'

interface DestinationData {
  destination_name: string
  country: string
  destination_tier: string
  total_revenue_gbp: number
  num_bookings: number
  avg_booking_value_gbp: number
}

const TIER_COLORS: Record<string, string> = {
  'Ultra-Luxury': '#1B4F6B',
  'Luxury':       '#C9A96E',
  'Premium':      '#2A6A8F',
}

function formatM(v: number) {
  return `£${(v / 1_000_000).toFixed(1)}M`
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-[#1B4F6B] mb-1">{d.destination_name}</p>
      <p className="text-gray-500 text-xs mb-2">{d.country} · <span style={{ color: TIER_COLORS[d.destination_tier] }}>{d.destination_tier}</span></p>
      <p className="text-gray-700">Revenue: <strong>{formatM(d.total_revenue_gbp)}</strong></p>
      <p className="text-gray-500">Bookings: <strong>{d.num_bookings?.toLocaleString()}</strong></p>
      <p className="text-gray-500">Avg Value: <strong>£{d.avg_booking_value_gbp?.toLocaleString()}</strong></p>
    </div>
  )
}

export default function TopDestinations({ data }: { data: DestinationData[] }) {
  return (
    <div className="chart-card">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1B4F6B]">Top Destinations</h2>
        <p className="text-sm text-gray-500 mt-0.5">Revenue by destination — all time</p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <div key={tier} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
            {tier}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis
            type="number"
            tickFormatter={formatM}
            tick={{ fontSize: 11, fill: '#888' }}
          />
          <YAxis
            dataKey="destination_name"
            type="category"
            width={115}
            tick={{ fontSize: 11, fill: '#555' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total_revenue_gbp" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={TIER_COLORS[entry.destination_tier] || '#2A6A8F'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
