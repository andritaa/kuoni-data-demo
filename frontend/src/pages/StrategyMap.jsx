import React, { useEffect, useRef, useState } from 'react'

const DERTOUR_RED = '#E40028'
const DERTOUR_BLUE = '#0058A3'
const DERTOUR_YELLOW = '#FAD73C'
const DARK = '#32373C'

// Strategy nodes — everything from your stakeholder briefing + architecture decisions
const nodes = [
  // === LAYER 1: Business Drivers (top) ===
  { id: 'revenue', label: 'Revenue\nProtection', group: 'driver', x: 150, y: 60, detail: 'Dynamic pricing across 10 brands. £8M/yr estimated uplift. Walsh + Boesch: highest-value near-term use case.', color: '#10B981' },
  { id: 'cost', label: 'Cost\nReduction', group: 'driver', x: 400, y: 60, detail: 'Replace Astronomer (£25K). Automate Tier 1 service queries. Self-service analytics reduces analyst bottleneck.', color: '#F59E0B' },
  { id: 'crisis', label: 'Crisis\nResponse', group: 'driver', x: 650, y: 60, detail: 'Iran conflict: Boesch said "day two you could have spotted it from telephony data." Near real-time demand sensing.', color: '#EF4444' },
  { id: 'integration', label: 'Hotelplan\nIntegration', group: 'driver', x: 900, y: 60, detail: 'Post-acquisition: 4 UK brands (Inghams, Explore, Santas, Inntravel) need platform unification with DERTOUR.', color: '#8B5CF6' },
  { id: 'restructure', label: 'April\nRestructure', group: 'driver', x: 1100, y: 60, detail: "Grant's org restructure — results end of April. Phase 1 architecture rec must land before then. HARD DEADLINE.", color: DERTOUR_RED },

  // === LAYER 2: Strategic Pillars ===
  { id: 'mesh', label: 'Decorated\nData Mesh', group: 'strategy', x: 250, y: 220, detail: 'Each brand = data product. Federated, not centralised. Group-level views use anonymised/aggregated data only. Thompson validated this approach.', color: DERTOUR_BLUE },
  { id: 'govern', label: 'Governance\nFirst', group: 'strategy', x: 550, y: 220, detail: 'IAM, data quality, KPI standards before analytics. Taylor: "governance from day one." Nunn nervous after Masetti meeting. Automated via dbt + Terraform.', color: '#7B42BC' },
  { id: 'native', label: 'Snowflake\nNative First', group: 'strategy', x: 850, y: 220, detail: 'Cortex AI, Tasks, Streams before buying tools. Nunn: "$25K Astronomer is too much." Use what Snowflake gives you. MWAA as Airflow alternative.', color: '#29B5E8' },
  { id: 'twoworld', label: 'Two Worlds\nAWS + SF', group: 'strategy', x: 1050, y: 220, detail: 'Brands keep AWS for BAU operations (Aydinlik: "AWS-first, microservices"). Snowflake = group analytical + AI layer. Clean separation.', color: '#FF9900' },

  // === LAYER 3: Platform Components ===
  { id: 'snowflake', label: '❄️ Snowflake', group: 'platform', x: 150, y: 400, detail: 'Central analytical platform. Medallion: Bronze→Silver→Gold. Per-brand schemas. Cortex AI. Model Registry. Vector search.', color: '#29B5E8' },
  { id: 'dbt', label: '⚙️ dbt', group: 'platform', x: 350, y: 400, detail: 'SQL-first transforms. Staging→intermediate→marts. Tests on every model. Documentation. CI/CD via GitHub Actions. Brand templates.', color: '#FF694A' },
  { id: 'terraform', label: '🏗️ Terraform', group: 'platform', x: 550, y: 400, detail: 'Infrastructure as Code. AWS + Snowflake provisioned together. Brand onboarding in 15 mins. No manual changes, ever.', color: '#7B42BC' },
  { id: 'airflow', label: '🔄 Airflow\n(MWAA)', group: 'platform', x: 750, y: 400, detail: 'AWS MWAA replacing Astronomer (£25K→£5K). DAGs: S3→Bronze→DQ→Gold. dbt trigger. Brand pipeline per DAG.', color: '#FF694A' },
  { id: 'cortex', label: '🤖 Cortex AI', group: 'platform', x: 950, y: 400, detail: 'Analyst (self-service SQL), Agents (autonomous), Search (RAG), Embeddings (vector), Fine-tuning, Guard (safety). All Snowflake-native.', color: '#10B981' },
  { id: 'mlflow', label: '🧠 MLflow', group: 'platform', x: 1150, y: 400, detail: 'Experiment tracking. Model registry. Deploy as Snowpark UDFs. Dynamic pricing model: XGBoost trained in-warehouse. Champion/challenger pattern.', color: '#8B5CF6' },

  // === LAYER 4: Data Sources ===
  { id: 'aws', label: '☁️ AWS\n(Brand BAU)', group: 'source', x: 150, y: 580, detail: 'Inghams, Explore, Inntravel microservices. S3 data landing zone. Snowpipe ingestion. SQS notifications.', color: '#FF9900' },
  { id: 'd365', label: '🟦 Dynamics\n365', group: 'source', x: 400, y: 580, detail: 'CRM + Finance. Dataverse native connector (GA 2025). Easter weekend: set up tenant + connection. Sales, Cases, Finance.', color: '#0078D4' },
  { id: 'booking', label: '✈️ Booking\nEngine', group: 'source', x: 650, y: 580, detail: 'Mythos (legacy, in-house). Peakwork nexTOs (DERTOUR group). ODL Travel Studio evaluated for specialist brands.', color: DARK },
  { id: 'web', label: '🌐 Web +\nTelephony', group: 'source', x: 900, y: 580, detail: "Website analytics, search data, telephony/call centre. Boesch's crisis example: detect Caribbean demand from call data.", color: '#6B7280' },
  { id: 'external', label: '📊 External\nData', group: 'source', x: 1100, y: 580, detail: 'Competitor pricing, weather, flight schedules, Trustpilot reviews. Snowflake Marketplace for third-party data.', color: '#6B7280' },

  // === LAYER 5: Consumers / Value ===
  { id: 'pricing', label: '💰 Dynamic\nPricing', group: 'value', x: 150, y: 740, detail: 'XGBoost model. Near real-time. Walsh: "holidays past departure = zero value." A/B tested. Human-in-the-loop. £8M/yr potential.', color: '#10B981' },
  { id: 'c360', label: '👤 Customer\n360', group: 'value', x: 350, y: 740, detail: 'Unified customer view within brands (PII stays in domain). Booking + CRM + web behaviour. Segmentation + LTV scoring.', color: DERTOUR_BLUE },
  { id: 'selfserve', label: '📊 Self-Service\nAnalytics', group: 'value', x: 550, y: 740, detail: 'Cortex Analyst: business users ask questions in English. Power BI dashboards. No SQL required. Reduces analyst bottleneck.', color: '#F59E0B' },
  { id: 'agents', label: '🤖 AI\nAgents', group: 'value', x: 750, y: 740, detail: 'Cortex Agents for: pricing recommendations, customer service, demand forecasting. Autonomous but governed.', color: '#8B5CF6' },
  { id: 'brand_onboard', label: '🏗️ Brand\nOnboarding', group: 'value', x: 950, y: 740, detail: '15 min per brand: Terraform + dbt + Airflow. Copy folder, change name, PR, merge. Scales to 180+ companies.', color: DERTOUR_RED },
  { id: 'exec', label: '📈 Executive\nDashboard', group: 'value', x: 1150, y: 740, detail: "Group-wide KPIs, brand comparison, crisis dashboard. Real-time. For Grant + leadership. Lives at frontend-production-a8c6.up.railway.app", color: DARK },
]

// Connections between nodes — showing strategy flow
const links = [
  // Drivers → Strategy
  { source: 'revenue', target: 'mesh' }, { source: 'revenue', target: 'native' },
  { source: 'cost', target: 'native' }, { source: 'cost', target: 'govern' },
  { source: 'crisis', target: 'native' }, { source: 'crisis', target: 'mesh' },
  { source: 'integration', target: 'mesh' }, { source: 'integration', target: 'twoworld' },
  { source: 'restructure', target: 'govern' }, { source: 'restructure', target: 'mesh' },

  // Strategy → Platform
  { source: 'mesh', target: 'snowflake' }, { source: 'mesh', target: 'dbt' },
  { source: 'govern', target: 'terraform' }, { source: 'govern', target: 'dbt' },
  { source: 'native', target: 'cortex' }, { source: 'native', target: 'airflow' }, { source: 'native', target: 'mlflow' },
  { source: 'twoworld', target: 'aws' }, { source: 'twoworld', target: 'snowflake' },

  // Platform → Sources
  { source: 'snowflake', target: 'aws' }, { source: 'snowflake', target: 'd365' }, { source: 'snowflake', target: 'booking' },
  { source: 'airflow', target: 'aws' }, { source: 'airflow', target: 'd365' },

  // Platform → Value
  { source: 'cortex', target: 'pricing' }, { source: 'cortex', target: 'selfserve' }, { source: 'cortex', target: 'agents' },
  { source: 'mlflow', target: 'pricing' }, { source: 'mlflow', target: 'c360' },
  { source: 'dbt', target: 'c360' }, { source: 'dbt', target: 'selfserve' }, { source: 'dbt', target: 'exec' },
  { source: 'terraform', target: 'brand_onboard' },
  { source: 'snowflake', target: 'exec' }, { source: 'snowflake', target: 'pricing' },

  // Legal constraint
  { source: 'mesh', target: 'c360', dashed: true },
]

const layerLabels = [
  { y: 30, label: 'BUSINESS DRIVERS', color: DERTOUR_RED },
  { y: 190, label: 'STRATEGIC PILLARS', color: DERTOUR_BLUE },
  { y: 370, label: 'PLATFORM COMPONENTS', color: '#7B42BC' },
  { y: 550, label: 'DATA SOURCES', color: '#FF9900' },
  { y: 710, label: 'VALUE DELIVERED', color: '#10B981' },
]

export default function StrategyMap() {
  const svgRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [filter, setFilter] = useState('all')

  const width = 1300
  const height = 820

  const connectedTo = (nodeId) => {
    const connected = new Set()
    links.forEach(l => {
      if (l.source === nodeId) connected.add(l.target)
      if (l.target === nodeId) connected.add(l.source)
    })
    connected.add(nodeId)
    return connected
  }

  const activeNodes = hovered ? connectedTo(hovered) : null
  const filteredNodes = filter === 'all' ? nodes : nodes.filter(n => n.group === filter)

  const selectedNode = nodes.find(n => n.id === selected)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold" style={{ color: DARK }}>Strategy Map</h2>
        <p className="text-gray-500 text-sm">Interactive architecture — click nodes to explore, hover to see connections</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { id: 'all', label: 'All', color: DARK },
          { id: 'driver', label: 'Drivers', color: DERTOUR_RED },
          { id: 'strategy', label: 'Strategy', color: DERTOUR_BLUE },
          { id: 'platform', label: 'Platform', color: '#7B42BC' },
          { id: 'source', label: 'Sources', color: '#FF9900' },
          { id: 'value', label: 'Value', color: '#10B981' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: filter === f.id ? f.color : '#f3f4f6', color: filter === f.id ? '#fff' : '#666' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ position: 'relative' }}>
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minHeight: 500 }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ccc" />
            </marker>
          </defs>

          {/* Layer labels */}
          {layerLabels.map(l => (
            <text key={l.y} x={10} y={l.y} fontSize={10} fontWeight="700" fill={l.color} letterSpacing="2" opacity={0.6}>
              {l.label}
            </text>
          ))}

          {/* Links */}
          {links.map((l, i) => {
            const source = nodes.find(n => n.id === l.source)
            const target = nodes.find(n => n.id === l.target)
            if (!source || !target) return null
            const isActive = !activeNodes || (activeNodes.has(l.source) && activeNodes.has(l.target))
            return (
              <line key={i}
                x1={source.x} y1={source.y + 20} x2={target.x} y2={target.y - 20}
                stroke={isActive ? '#ccc' : '#f0f0f0'}
                strokeWidth={isActive ? 1.5 : 0.5}
                strokeDasharray={l.dashed ? '4 4' : 'none'}
                markerEnd="url(#arrow)"
              />
            )
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const isActive = !activeNodes || activeNodes.has(n.id)
            const isSelected = selected === n.id
            const isFiltered = filter === 'all' || n.group === filter
            return (
              <g key={n.id}
                onClick={() => setSelected(selected === n.id ? null : n.id)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer', opacity: isFiltered ? (isActive ? 1 : 0.3) : 0.1, transition: 'opacity 0.3s' }}>
                <rect x={n.x - 55} y={n.y - 22} width={110} height={44} rx={10}
                  fill={isSelected ? n.color : '#fff'}
                  stroke={n.color} strokeWidth={isSelected ? 3 : 2} />
                <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize={10} fontWeight="700"
                  fill={isSelected ? '#fff' : n.color}>
                  {n.label.split('\n')[0]}
                </text>
                <text x={n.x} y={n.y + 10} textAnchor="middle" fontSize={9} fontWeight="500"
                  fill={isSelected ? '#fff' : DARK}>
                  {n.label.split('\n')[1] || ''}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Detail Panel */}
        {selectedNode && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-200"
            style={{ borderLeft: `4px solid ${selectedNode.color}` }}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm" style={{ color: selectedNode.color }}>{selectedNode.label.replace('\n', ' ')}</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-3xl">{selectedNode.detail}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-400 mt-2 text-center">Click a node for details · Hover to highlight connections · Filter by layer</p>
    </div>
  )
}
