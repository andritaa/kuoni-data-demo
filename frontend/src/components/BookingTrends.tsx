'use client'

interface FunnelStage {
  stage: string
  count: number
  conversion_pct?: number
  channel_breakdown?: Record<string, number>
}

const STAGE_COLORS: Record<string, string> = {
  'Enquiries':  '#2A6A8F',
  'Quotes':     '#1B4F6B',
  'Bookings':   '#C9A96E',
  'Completed':  '#16A34A',
}

export default function BookingTrends({ data }: { data: FunnelStage[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  // Overall conversion: first to last
  const overallConversion = data.length >= 2
    ? ((data[data.length - 1].count / data[0].count) * 100).toFixed(1)
    : '0'

  return (
    <div className="chart-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#1B4F6B]">Booking Funnel</h2>
          <p className="text-sm text-gray-500 mt-0.5">Enquiry to completion — last 12 months</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[#C9A96E]">{overallConversion}%</span>
          <p className="text-xs text-gray-500">overall conversion</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((stage, i) => {
          const width = (stage.count / maxCount) * 100
          const drop = i > 0 ? (((data[i-1].count - stage.count) / data[i-1].count) * 100).toFixed(0) : null
          const color = STAGE_COLORS[stage.stage] || '#1B4F6B'

          return (
            <div key={stage.stage}>
              {/* Drop-off indicator */}
              {drop && (
                <div className="flex items-center gap-2 mb-1 ml-2">
                  <span className="text-xs text-red-400">▼ {drop}% drop-off</span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24 text-right shrink-0">{stage.stage}</span>
                <div className="flex-1 relative">
                  <div
                    className="h-10 rounded-r-lg flex items-center px-3 transition-all duration-500"
                    style={{ width: `${width}%`, backgroundColor: color, minWidth: '80px' }}
                  >
                    <span className="text-white text-sm font-bold">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Channel breakdown table */}
      {data[0]?.channel_breakdown && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Enquiries by Channel</p>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(data[0].channel_breakdown).map(([ch, count]) => (
              <div key={ch} className="text-center">
                <div className="text-lg font-bold text-[#1B4F6B]">{(count / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-500">{ch}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
