import React, { useState, useMemo, useCallback } from 'react'

const DARK = '#32373C'
const RED = '#E40028'
const BLUE = '#0058A3'
const YELLOW = '#FAD73C'

// ─── DATA ────────────────────────────────────────────────

const layers = [
  { id: 'driver', label: 'Business Drivers', color: RED, ring: 1 },
  { id: 'strategy', label: 'Strategic Pillars', color: BLUE, ring: 2 },
  { id: 'platform', label: 'Platform', color: '#7B42BC', ring: 3 },
  { id: 'source', label: 'Data Sources', color: '#FF9900', ring: 4 },
  { id: 'value', label: 'Value Delivered', color: '#10B981', ring: 5 },
]

const nodes = [
  // Drivers
  { id: 'revenue', label: 'Revenue Protection', group: 'driver', detail: 'Dynamic pricing: £8M/yr potential. Walsh + Boesch: #1 use case. Near real-time demand sensing essential.', stakeholder: 'Boesch, Walsh' },
  { id: 'cost', label: 'Cost Reduction', group: 'driver', detail: 'Replace Astronomer (£25K→£5K). Automate Tier 1 queries. Self-service analytics.', stakeholder: 'Nunn, Quinlisk' },
  { id: 'crisis', label: 'Crisis Response', group: 'driver', detail: '"Day two of the crisis, telephony data could have spotted Caribbean demand." Need connected, real-time data.', stakeholder: 'Boesch' },
  { id: 'integration', label: 'Hotelplan Integration', group: 'driver', detail: '4 UK brands acquired. Running on legacy Mythos. Need platform unification.', stakeholder: 'Caseley-Austin, Aydinlik' },
  { id: 'restructure', label: 'April Restructure', group: 'driver', detail: "HARD DEADLINE. Grant's org restructure end of April. Architecture rec must land before then.", stakeholder: 'Thompson, Grant' },

  // Strategy
  { id: 'mesh', label: 'Decorated Data Mesh', group: 'strategy', detail: 'Brand data = product. Federated. Group views = anonymised only. Thompson validated. Legal PII constraint enforced.', stakeholder: 'Thompson, Boesch' },
  { id: 'govern', label: 'Governance First', group: 'strategy', detail: 'IAM, DQ, KPI standards BEFORE analytics. Governance as code: dbt tests + Terraform. Not committees.', stakeholder: 'Taylor, Nunn' },
  { id: 'native', label: 'Snowflake Native', group: 'strategy', detail: 'Cortex AI, Tasks, Streams before buying tools. $25K Astronomer validates this. MWAA as alternative.', stakeholder: 'Nunn, Josefsson' },
  { id: 'twoworld', label: 'AWS + Snowflake', group: 'strategy', detail: 'Brands keep AWS for operations. Snowflake = group analytical + AI layer. Clean separation.', stakeholder: 'Aydinlik, Swathi' },

  // Platform
  { id: 'snowflake', label: 'Snowflake', group: 'platform', detail: 'Central platform. Medallion: Bronze→Silver→Gold. Cortex AI. Model Registry. Vector search. Per-brand schemas.', stakeholder: 'Caseley-Austin, Swathi' },
  { id: 'dbt', label: 'dbt', group: 'platform', detail: 'SQL transforms. Staging→marts. Tests on every model. CI/CD. Brand templates. Semantic layer.', stakeholder: 'Taylor' },
  { id: 'terraform', label: 'Terraform IaC', group: 'platform', detail: 'AWS + Snowflake provisioned together. Brand onboarding in 15 mins. No manual changes.', stakeholder: 'Swathi' },
  { id: 'airflow', label: 'Airflow (MWAA)', group: 'platform', detail: 'AWS MWAA replacing Astronomer. £25K→£5K. DAGs per brand. S3→Bronze→DQ→Gold.', stakeholder: 'Nunn' },
  { id: 'cortex', label: 'Cortex AI', group: 'platform', detail: 'Analyst (self-service), Agents (autonomous), Search (RAG), Embeddings, Fine-tuning, Guard.', stakeholder: 'Josefsson' },
  { id: 'mlflow', label: 'MLflow', group: 'platform', detail: 'Experiment tracking. Model registry. Deploy as UDFs. Dynamic pricing: XGBoost in-warehouse.', stakeholder: 'Walsh' },

  // Sources
  { id: 'aws', label: 'AWS (Brand BAU)', group: 'source', detail: 'Inghams, Explore, Inntravel microservices. S3 landing zone. Snowpipe ingestion.', stakeholder: 'Aydinlik, Hakan' },
  { id: 'd365', label: 'Dynamics 365', group: 'source', detail: 'CRM + Finance. Dataverse native connector. Easter weekend setup. Sales, Cases, Finance.', stakeholder: 'Allen' },
  { id: 'booking', label: 'Booking Engine', group: 'source', detail: 'Mythos (legacy). Peakwork nexTOs (group). ODL Travel Studio (specialist).', stakeholder: 'Walsh' },
  { id: 'web', label: 'Web + Telephony', group: 'source', detail: 'Analytics, search, call centre data. Crisis demand signals from telephony.', stakeholder: 'Boesch' },

  // Value
  { id: 'pricing', label: 'Dynamic Pricing', group: 'value', detail: 'XGBoost model. £8M/yr. A/B tested. Human-in-the-loop. Walsh validates outputs.', stakeholder: 'Walsh, Boesch' },
  { id: 'c360', label: 'Customer 360', group: 'value', detail: 'Within-brand only (PII constraint). Booking + CRM + web. Segmentation + LTV.', stakeholder: 'Thompson' },
  { id: 'selfserve', label: 'Self-Service Analytics', group: 'value', detail: 'Cortex Analyst: ask in English. Power BI. No SQL needed. Kills analyst bottleneck.', stakeholder: 'Quinlisk' },
  { id: 'agents', label: 'AI Agents', group: 'value', detail: 'Pricing recommendations. Customer service. Demand forecasting. Autonomous but governed.', stakeholder: 'Josefsson' },
  { id: 'onboard', label: 'Brand Onboarding', group: 'value', detail: '15 min per brand. Terraform + dbt + Airflow. Copy, change name, PR, merge. Scales to 180+.', stakeholder: 'Grant, Taylor' },
]

const links = [
  { s: 'revenue', t: 'mesh', w: 3 }, { s: 'revenue', t: 'native', w: 2 },
  { s: 'cost', t: 'native', w: 3 }, { s: 'cost', t: 'govern', w: 1 },
  { s: 'crisis', t: 'native', w: 2 }, { s: 'crisis', t: 'mesh', w: 2 },
  { s: 'integration', t: 'mesh', w: 3 }, { s: 'integration', t: 'twoworld', w: 3 },
  { s: 'restructure', t: 'govern', w: 2 }, { s: 'restructure', t: 'mesh', w: 1 },
  { s: 'mesh', t: 'snowflake', w: 3 }, { s: 'mesh', t: 'dbt', w: 2 },
  { s: 'govern', t: 'terraform', w: 3 }, { s: 'govern', t: 'dbt', w: 2 },
  { s: 'native', t: 'cortex', w: 3 }, { s: 'native', t: 'airflow', w: 2 }, { s: 'native', t: 'mlflow', w: 2 },
  { s: 'twoworld', t: 'snowflake', w: 2 }, { s: 'twoworld', t: 'aws', w: 2 },
  { s: 'snowflake', t: 'pricing', w: 3 }, { s: 'cortex', t: 'selfserve', w: 3 }, { s: 'cortex', t: 'agents', w: 3 },
  { s: 'mlflow', t: 'pricing', w: 3 }, { s: 'dbt', t: 'c360', w: 2 },
  { s: 'terraform', t: 'onboard', w: 3 }, { s: 'snowflake', t: 'aws', w: 2 },
  { s: 'snowflake', t: 'd365', w: 2 }, { s: 'airflow', t: 'booking', w: 2 },
  { s: 'cortex', t: 'pricing', w: 2 }, { s: 'dbt', t: 'selfserve', w: 2 },
]

// ─── RADIAL LAYOUT ───────────────────────────────────────

function RadialView({ selected, setSelected, hovered, setHovered }) {
  const cx = 500, cy = 400
  const ringRadii = { driver: 120, strategy: 220, platform: 310, source: 380, value: 440 }

  const positioned = useMemo(() => {
    const grouped = {}
    nodes.forEach(n => { if (!grouped[n.group]) grouped[n.group] = []; grouped[n.group].push(n) })
    const result = []
    Object.entries(grouped).forEach(([group, items]) => {
      const r = ringRadii[group]
      items.forEach((n, i) => {
        const angle = (2 * Math.PI * i / items.length) - Math.PI / 2
        result.push({ ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) })
      })
    })
    return result
  }, [])

  const connected = useMemo(() => {
    if (!hovered) return null
    const s = new Set([hovered])
    links.forEach(l => { if (l.s === hovered) s.add(l.t); if (l.t === hovered) s.add(l.s) })
    return s
  }, [hovered])

  const getNode = id => positioned.find(n => n.id === id)

  return (
    <svg viewBox="0 0 1000 800" className="w-full" style={{ minHeight: 500 }}>
      {/* Rings */}
      {layers.map(l => (
        <g key={l.id}>
          <circle cx={cx} cy={cy} r={ringRadii[l.id]} fill="none" stroke={l.color} strokeWidth={0.5} opacity={0.2} strokeDasharray="4 4" />
          <text x={cx + ringRadii[l.id] + 8} y={cy - 8} fontSize={8} fill={l.color} fontWeight="700" opacity={0.5}>
            {l.label.toUpperCase()}
          </text>
        </g>
      ))}

      {/* Links */}
      {links.map((l, i) => {
        const s = getNode(l.s), t = getNode(l.t)
        if (!s || !t) return null
        const active = !connected || (connected.has(l.s) && connected.has(l.t))
        return (
          <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke={active ? layers.find(la => la.id === s.group)?.color || '#ccc' : '#f0f0f0'}
            strokeWidth={active ? l.w * 0.8 : 0.3} opacity={active ? 0.4 : 0.1} />
        )
      })}

      {/* Center label */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={14} fontWeight="800" fill={DARK}>DERTOUR</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#999">Data Strategy</text>

      {/* Nodes */}
      {positioned.map(n => {
        const layer = layers.find(l => l.id === n.group)
        const active = !connected || connected.has(n.id)
        const isSel = selected === n.id
        const r = 28
        return (
          <g key={n.id} onClick={() => setSelected(isSel ? null : n.id)}
            onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer', opacity: active ? 1 : 0.15, transition: 'all 0.3s' }}>
            <circle cx={n.x} cy={n.y} r={r}
              fill={isSel ? layer.color : '#fff'} stroke={layer.color} strokeWidth={isSel ? 3 : 2} />
            <text x={n.x} y={n.y - 3} textAnchor="middle" fontSize={7} fontWeight="700"
              fill={isSel ? '#fff' : DARK}>
              {n.label.length > 16 ? n.label.substring(0, 14) + '…' : n.label}
            </text>
            <text x={n.x} y={n.y + 7} textAnchor="middle" fontSize={6} fill={isSel ? '#eee' : '#999'}>
              {n.stakeholder?.split(',')[0]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── CONCENTRIC RINGS (Sunburst style) ───────────────────

function SunburstView({ selected, setSelected, hovered, setHovered }) {
  const cx = 500, cy = 400

  const arcs = useMemo(() => {
    const result = []
    const grouped = {}
    nodes.forEach(n => { if (!grouped[n.group]) grouped[n.group] = []; grouped[n.group].push(n) })

    layers.forEach(layer => {
      const items = grouped[layer.id] || []
      const innerR = layer.ring * 65
      const outerR = innerR + 55
      items.forEach((n, i) => {
        const startAngle = (2 * Math.PI * i / items.length) - Math.PI / 2
        const endAngle = (2 * Math.PI * (i + 0.85) / items.length) - Math.PI / 2
        const midAngle = (startAngle + endAngle) / 2

        const x1i = cx + innerR * Math.cos(startAngle), y1i = cy + innerR * Math.sin(startAngle)
        const x1o = cx + outerR * Math.cos(startAngle), y1o = cy + outerR * Math.sin(startAngle)
        const x2i = cx + innerR * Math.cos(endAngle), y2i = cy + innerR * Math.sin(endAngle)
        const x2o = cx + outerR * Math.cos(endAngle), y2o = cy + outerR * Math.sin(endAngle)

        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
        const path = `M ${x1i} ${y1i} L ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1i} ${y1i}`

        const labelR = (innerR + outerR) / 2
        const labelX = cx + labelR * Math.cos(midAngle)
        const labelY = cy + labelR * Math.sin(midAngle)

        result.push({ ...n, path, labelX, labelY, midAngle, color: layer.color })
      })
    })
    return result
  }, [])

  const connected = useMemo(() => {
    if (!hovered) return null
    const s = new Set([hovered])
    links.forEach(l => { if (l.s === hovered) s.add(l.t); if (l.t === hovered) s.add(l.s) })
    return s
  }, [hovered])

  return (
    <svg viewBox="0 0 1000 800" className="w-full" style={{ minHeight: 500 }}>
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={16} fontWeight="800" fill={DARK}>DERTOUR</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#999">Strategy</text>

      {arcs.map(a => {
        const active = !connected || connected.has(a.id)
        const isSel = selected === a.id
        return (
          <g key={a.id} onClick={() => setSelected(isSel ? null : a.id)}
            onMouseEnter={() => setHovered(a.id)} onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
            <path d={a.path} fill={isSel ? a.color : a.color + '22'} stroke={a.color}
              strokeWidth={isSel ? 2 : 1} opacity={active ? 1 : 0.15} />
            <text x={a.labelX} y={a.labelY - 3} textAnchor="middle" fontSize={7} fontWeight="700"
              fill={active ? DARK : '#ccc'} style={{ pointerEvents: 'none' }}>
              {a.label.length > 18 ? a.label.substring(0, 16) + '…' : a.label}
            </text>
            <text x={a.labelX} y={a.labelY + 7} textAnchor="middle" fontSize={6}
              fill={active ? '#999' : '#ddd'} style={{ pointerEvents: 'none' }}>
              {a.stakeholder?.split(',')[0]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── FLOW VIEW (Sankey-inspired horizontal) ──────────────

function FlowView({ selected, setSelected, hovered, setHovered }) {
  const colX = { driver: 80, strategy: 310, platform: 540, source: 770, value: 1000 }
  const colW = 170

  const positioned = useMemo(() => {
    const grouped = {}
    nodes.forEach(n => { if (!grouped[n.group]) grouped[n.group] = []; grouped[n.group].push(n) })
    const result = []
    Object.entries(grouped).forEach(([group, items]) => {
      const x = colX[group]
      const spacing = Math.min(70, 600 / items.length)
      const startY = 400 - (items.length * spacing) / 2
      items.forEach((n, i) => {
        result.push({ ...n, x: x, y: startY + i * spacing })
      })
    })
    return result
  }, [])

  const getNode = id => positioned.find(n => n.id === id)
  const connected = useMemo(() => {
    if (!hovered) return null
    const s = new Set([hovered])
    links.forEach(l => { if (l.s === hovered) s.add(l.t); if (l.t === hovered) s.add(l.s) })
    return s
  }, [hovered])

  return (
    <svg viewBox="0 0 1150 800" className="w-full" style={{ minHeight: 500 }}>
      {/* Column headers */}
      {layers.map(l => (
        <g key={l.id}>
          <rect x={colX[l.id] - 15} y={20} width={colW} height={24} rx={6} fill={l.color} />
          <text x={colX[l.id] + colW/2 - 15} y={36} textAnchor="middle" fontSize={9} fontWeight="700" fill="#fff">{l.label.toUpperCase()}</text>
        </g>
      ))}

      {/* Flow links — curved */}
      {links.map((l, i) => {
        const s = getNode(l.s), t = getNode(l.t)
        if (!s || !t) return null
        const active = !connected || (connected.has(l.s) && connected.has(l.t))
        const sLayer = layers.find(la => la.id === s.group)
        const midX = (s.x + t.x) / 2
        return (
          <path key={i}
            d={`M ${s.x + 70} ${s.y} C ${midX} ${s.y}, ${midX} ${t.y}, ${t.x - 15} ${t.y}`}
            fill="none" stroke={active ? sLayer?.color || '#ccc' : '#f5f5f5'}
            strokeWidth={active ? l.w * 1.2 : 0.5} opacity={active ? 0.35 : 0.1} />
        )
      })}

      {/* Nodes as rounded rects */}
      {positioned.map(n => {
        const layer = layers.find(l => l.id === n.group)
        const active = !connected || connected.has(n.id)
        const isSel = selected === n.id
        return (
          <g key={n.id} onClick={() => setSelected(isSel ? null : n.id)}
            onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer', opacity: active ? 1 : 0.15, transition: 'all 0.3s' }}>
            <rect x={n.x - 15} y={n.y - 18} width={colW} height={36} rx={8}
              fill={isSel ? layer.color : '#fff'} stroke={layer.color} strokeWidth={isSel ? 2.5 : 1.5} />
            <text x={n.x + colW/2 - 15} y={n.y - 3} textAnchor="middle" fontSize={9} fontWeight="700"
              fill={isSel ? '#fff' : DARK}>{n.label}</text>
            <text x={n.x + colW/2 - 15} y={n.y + 9} textAnchor="middle" fontSize={7}
              fill={isSel ? '#ddd' : '#999'}>{n.stakeholder?.split(',')[0]}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────

export default function StrategyMap() {
  const [view, setView] = useState('radial')
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)

  const selectedNode = nodes.find(n => n.id === selected)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: DARK }}>Strategy Map</h2>
          <p className="text-gray-400 text-sm">Hover to explore connections · Click for details · Switch views</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'radial', label: '◎ Radial' },
            { id: 'sunburst', label: '◐ Sunburst' },
            { id: 'flow', label: '→ Flow' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{ background: view === v.id ? DARK : 'transparent', color: view === v.id ? '#fff' : '#666' }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ position: 'relative' }}>
        {view === 'radial' && <RadialView selected={selected} setSelected={setSelected} hovered={hovered} setHovered={setHovered} />}
        {view === 'sunburst' && <SunburstView selected={selected} setSelected={setSelected} hovered={hovered} setHovered={setHovered} />}
        {view === 'flow' && <FlowView selected={selected} setSelected={setSelected} hovered={hovered} setHovered={setHovered} />}

        {/* Detail panel */}
        {selectedNode && (
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 backdrop-blur border-t-2"
            style={{ borderTopColor: layers.find(l => l.id === selectedNode.group)?.color }}>
            <div className="flex items-start justify-between max-w-3xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: layers.find(l => l.id === selectedNode.group)?.color }}>
                    {layers.find(l => l.id === selectedNode.group)?.label}
                  </span>
                  <h3 className="font-bold text-sm" style={{ color: DARK }}>{selectedNode.label}</h3>
                </div>
                <p className="text-xs text-gray-600 mt-1">{selectedNode.detail}</p>
                <p className="text-[10px] text-gray-400 mt-2">Stakeholders: {selectedNode.stakeholder}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-xl ml-4">✕</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
