'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

interface RevenueData {
  year_month: string
  month_name: string
  total_revenue_gbp: number
  num_bookings: number
  avg_booking_value_gbp: number
}

function formatGBP(value: number): string {
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `£${(value / 1_000).toFixed(0)}K`
  return `£${value.toFixed(0)}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-[#1B4F6B] mb-1">{d?.month_name} {d?.year_month?.split('-')[0]}</p>
      <p className="text-gray-700">Revenue: <span className="font-bold text-[#1B4F6B]">{formatGBP(d?.total_revenue_gbp)}</span></p>
      <p className="text-gray-500">Bookings: <span className="font-semibold">{d?.num_bookings?.toLocaleString()}</span></p>
      <p className="text-gray-500">Avg Value: <span className="font-semibold">{formatGBP(d?.avg_booking_value_gbp)}</span></p>
    </div>
  )
}

export default function RevenueChart({ data }: { data: RevenueData[] }) {
  const shortLabel = (ym: string) => {
    const [year, month] = ym.split('-')
    const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[parseInt(month)]} ${year.slice(2)}`
  }

  return (
    <div className="chart-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#1B4F6B]">Revenue Trend</h2>
          <p className="text-sm text-gray-500 mt-0.5">Monthly booking revenue — last 24 months</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-4 h-0.5 bg-[#C9A96E] inline-block" />
          <span>Revenue</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year_month"
            tickFormatter={shortLabel}
            tick={{ fontSize: 11, fill: '#888' }}
            interval={2}
          />
          <YAxis
            tickFormatter={formatGBP}
            tick={{ fontSize: 11, fill: '#888' }}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Highlight peak months */}
          <ReferenceLine x={data.find(d => d.month_name === 'January')?.year_month} stroke="#C9A96E22" strokeWidth={20} />
          <Line
            type="monotone"
            dataKey="total_revenue_gbp"
            stroke="#C9A96E"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#1B4F6B' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
