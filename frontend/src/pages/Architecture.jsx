import React, { useState } from 'react'

const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'
const RED = '#C0392B'
const GREEN = '#27AE60'
const AMBER = '#E67E22'

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
      <h2 className="text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2" style={{color:TEAL}}>
        <span>{icon}</span>{title}
      </h2>
      {children}
    </div>
  )
}

function Badge({ color, children }) {
  const colors = {
    red: {bg:'#FEE2E2',text:'#991B1B',border:'#FECACA'},
    amber: {bg:'#FEF3C7',text:'#92400E',border:'#FDE68A'},
    green: {bg:'#D1FAE5',text:'#065F46',border:'#A7F3D0'},
    blue: {bg:'#DBEAFE',text:'#1E40AF',border:'#BFDBFE'},
    gold: {bg:'#FEF3C7',text:'#78350F',border:'#FDE68A'},
  }
  const c = colors[color] || colors.blue
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{background:c.bg,color:c.text,border:`1px solid ${c.border}`}}>{children}</span>
}

const assessmentItems = [
  { area: 'Warehouse Sizing', status: 'amber', finding: 'Single XS warehouse for all workloads — ETL, reporting, and ad-hoc queries competing for compute', recommendation: 'Separate warehouses by workload type: ETL (M, scheduled), Reporting (S, auto-resume), Ad-hoc (XS, auto-suspend 60s)' },
  { area: 'Data Modelling', status: 'red', finding: 'Flat, denormalised reporting tables created tactically — no reusable dimensional model', recommendation: 'Implement Medallion architecture: Bronze (raw) → Silver (conformed dims/facts) → Gold (business aggregates)' },
  { area: 'Data Ingestion', status: 'amber', finding: 'Manual CSV uploads and scheduled SQL scripts — no event-driven ingestion', recommendation: 'Introduce Snowpipe for near-real-time ingestion from booking engine; Fivetran for CRM sync' },
  { area: 'Access Control', status: 'red', finding: 'SYSADMIN role used for all operations — no RBAC, no data masking for PII', recommendation: 'Implement role hierarchy: SYSADMIN → DATAENG → ANALYST → READONLY. Dynamic data masking for customer PII' },
  { area: 'Cost Management', status: 'amber', finding: 'No resource monitors — risk of unexpected compute spend', recommendation: 'Set resource monitors at account and warehouse level. Enable auto-suspend on all warehouses' },
  { area: 'Power BI Integration', status: 'green', finding: 'Power BI connected via ODBC — reports functioning', recommendation: 'Migrate to Snowflake Partner Connect + DirectQuery for real-time dashboards. Consider partner-managed warehouse' },
  { area: 'Data Quality', status: 'red', finding: 'No data contracts, no dbt tests, no observability', recommendation: 'Introduce dbt with schema tests + freshness checks. Implement data observability (Great Expectations or Monte Carlo)' },
  { area: 'Documentation', status: 'red', finding: 'No data dictionary, no lineage tracking', recommendation: 'Enable Snowflake Access History + Object Tagging. Connect to data catalog (Alation or Atlan)' },
]

const integrations = [
  { name: 'Booking Engine', type: 'Source', tool: 'Snowpipe / Kafka', icon: '✈️', desc: 'Amadeus / Travelport → real-time booking events via Snowpipe Streaming', color: '#1B4F6B' },
  { name: 'Salesforce CRM', type: 'Source', tool: 'Fivetran', icon: '👥', desc: 'Customer 360 — contacts, leads, opportunities, cases synced hourly', color: '#00A1E0' },
  { name: 'Finance / ERP', type: 'Source', tool: 'Fivetran / JDBC', icon: '💷', desc: 'Revenue recognition, margin data, supplier payments', color: '#2E6F8F' },
  { name: 'Web Analytics', type: 'Source', tool: 'Snowpipe', icon: '🌐', desc: 'Adobe Analytics / GA4 → clickstream, session, conversion data', color: '#4A7C9B' },
  { name: 'Snowflake', type: 'Core', tool: 'Data Platform', icon: '❄️', desc: 'Bronze → Silver → Gold medallion layers. Central source of truth', color: '#29B5E8' },
  { name: 'dbt Cloud', type: 'Transform', tool: 'dbt', icon: '⚙️', desc: 'SQL-first transformations, tests, lineage, documentation', color: '#FF694A' },
  { name: 'Power BI', type: 'Consume', tool: 'DirectQuery', icon: '📊', desc: 'Executive dashboards, operational reports, self-service analytics', color: '#F2C811' },
  { name: 'Data Governance', type: 'Govern', tool: 'Atlan / Alation', icon: '🔐', desc: 'Data catalog, lineage, PII tagging, access request workflow', color: '#8B5CF6' },
]

const roadmapItems = [
  {
    phase: 'Phase 1 — Stabilise', weeks: 'Weeks 1–4', color: TEAL,
    items: [
      'Current state audit — document all tables, warehouses, roles, integrations',
      'Implement RBAC — separate roles for data engineering, analytics, readonly',
      'Add resource monitors — prevent runaway compute costs',
      'Enable auto-suspend on all warehouses (60–120s)',
      'Apply dynamic data masking on PII fields (customer email, phone, DOB)',
      'Establish dbt project structure with existing models',
    ]
  },
  {
    phase: 'Phase 2 — Elevate', weeks: 'Weeks 5–10', color: GOLD,
    items: [
      'Implement Medallion architecture — refactor flat tables to Bronze/Silver/Gold',
      'Build dimensional model — FCT_BOOKING, DIM_CUSTOMER, DIM_DESTINATION, DIM_DATE',
      'Set up Snowpipe for booking engine — near real-time data',
      'Connect Fivetran for Salesforce CRM — unified customer view',
      'Rebuild Power BI reports on Gold layer — faster, more reliable',
      'Introduce dbt tests and freshness checks — data quality gates',
    ]
  },
  {
    phase: 'Phase 3 — Scale', weeks: 'Weeks 11–16', color: '#27AE60',
    items: [
      'Customer 360 view — unified profile from CRM, bookings, web, calls',
      'Predictive analytics — demand forecasting, customer LTV modelling (Snowpark ML)',
      'Data marketplace — Snowflake Data Sharing with suppliers and partners',
      'Self-service analytics layer — governed semantic model for business teams',
      'Data observability tooling — SLA monitoring, anomaly detection',
      'Architecture documentation and handover — sustainable, team-owned platform',
    ]
  },
]

export default function Architecture() {
  const [activePhase, setActivePhase] = useState(0)

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Executive Summary */}
      <Section title="Current State Assessment" icon="🔍">
        <div className="flex items-start gap-4 mb-6 p-4 rounded-xl" style={{background:'#EBF4F8',border:'1px solid #B8D4E0'}}>
          <div className="text-3xl">💡</div>
          <div>
            <p className="text-sm font-semibold mb-1" style={{color:TEAL}}>Situation: Tactical Snowflake, Strategic Opportunity</p>
            <p className="text-sm text-gray-600">Snowflake was introduced to solve an immediate reporting challenge. It's functioning — but it's been architected tactically, not strategically. The opportunity is to take what's working and build a data platform that can power Kuoni's commercial and operational decision-making for the next 5+ years.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Area</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Current Finding</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {assessmentItems.map((item, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-xs" style={{color:TEAL}}>{item.area}</td>
                  <td className="py-3 px-3">
                    <Badge color={item.status}>{item.status === 'red' ? '🔴 Critical' : item.status === 'amber' ? '🟡 Improve' : '🟢 Good'}</Badge>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-600 max-w-xs">{item.finding}</td>
                  <td className="py-3 px-3 text-xs text-gray-700 max-w-xs font-medium">{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Integration Architecture */}
      <Section title="Target Integration Architecture" icon="🔗">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {integrations.map(s => (
            <div key={s.name} className="rounded-xl p-4 border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className="text-xs font-bold" style={{color:s.color}}>{s.name}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded text-gray-500" style={{background:'#F3F4F6'}}>{s.type}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium mb-1">{s.tool}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        {/* Flow diagram */}
        <div className="rounded-xl p-4 mt-4" style={{background:'#F8F6F3',border:'1px solid #E5E7EB'}}>
          <p className="text-xs font-semibold text-center text-gray-500 mb-3">DATA FLOW</p>
          <div className="flex items-center justify-between flex-wrap gap-2 text-center text-xs">
            {[
              {label:'SOURCES',items:['Booking Engine','Salesforce CRM','Finance ERP','Web Analytics'],color:TEAL},
              {label:'INGEST',items:['Snowpipe','Fivetran','JDBC','Kafka'],color:'#8B5CF6'},
              {label:'STORE',items:['❄️ BRONZE','❄️ SILVER','❄️ GOLD'],color:'#29B5E8'},
              {label:'TRANSFORM',items:['dbt Cloud','Snowpark','SQL'],color:'#FF694A'},
              {label:'CONSUME',items:['Power BI','Tableau','API','ML'],color:GOLD},
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold mb-2 py-1 px-2 rounded text-white" style={{background:step.color}}>{step.label}</div>
                  {step.items.map(item => <div key={item} className="text-xs text-gray-600 py-0.5">{item}</div>)}
                </div>
                {i < arr.length - 1 && <div className="text-gray-300 text-xl flex-shrink-0">→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Section>

      {/* Roadmap */}
      <Section title="Strategic Roadmap" icon="🗺️">
        <div className="flex gap-2 mb-6">
          {roadmapItems.map((phase, i) => (
            <button key={i} onClick={() => setActivePhase(i)}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2"
              style={{
                background: activePhase === i ? phase.color : 'white',
                color: activePhase === i ? 'white' : phase.color,
                borderColor: phase.color,
              }}>
              <p>{phase.phase}</p>
              <p className="text-xs opacity-75 font-normal mt-0.5">{phase.weeks}</p>
            </button>
          ))}
        </div>
        <div className="rounded-xl p-5" style={{background:'#F8F6F3',border:`2px solid ${roadmapItems[activePhase].color}30`}}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roadmapItems[activePhase].items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs text-white font-bold"
                  style={{background:roadmapItems[activePhase].color}}>{i+1}</div>
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Business Value */}
      <Section title="Business Value Delivered" icon="💼">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Commercial Insight', icon: '📈', items: ['Destination profitability by segment', 'Booking channel ROI', 'Tailor-made vs package margin comparison', 'Seasonal demand forecasting for pricing'] },
            { title: 'Operational Efficiency', icon: '⚡', items: ['Real-time booking pipeline visibility', 'Cancellation risk scoring', 'Agent performance dashboards', 'Supplier cost vs revenue analysis'] },
            { title: 'Customer Intelligence', icon: '❤️', items: ['Customer 360 — single unified profile', 'Lifetime value modelling by segment', 'Propensity to rebook scoring', 'NPS correlation with booking attributes'] },
          ].map(v => (
            <div key={v.title} className="rounded-xl p-5 text-white" style={{background:TEAL}}>
              <div className="text-2xl mb-2">{v.icon}</div>
              <h3 className="font-bold mb-3" style={{color:GOLD}}>{v.title}</h3>
              <ul className="space-y-1.5">
                {v.items.map(item => (
                  <li key={item} className="text-xs text-white/80 flex items-start gap-1.5">
                    <span style={{color:GOLD}}>→</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </main>
  )
}
