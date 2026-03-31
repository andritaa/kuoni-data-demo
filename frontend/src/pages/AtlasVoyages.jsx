import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8010'
const RED = '#E40028'
const BLUE = '#0058A3'
const DARK = '#32373C'

function Card({ title, children, color = DARK, icon = '' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        <h3 className="text-sm font-bold" style={{ color }}>{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function KPI({ label, value, sub, color = BLUE }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-300">{sub}</p>}
    </div>
  )
}

function DQBar({ score, label }) {
  const color = score >= 95 ? '#10B981' : score >= 80 ? '#F59E0B' : '#EF4444'
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}

export default function AtlasVoyages() {
  const [kpis, setKpis] = useState(null)
  const [dq, setDq] = useState([])
  const [lineage, setLineage] = useState([])
  const [customers, setCustomers] = useState([])
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    fetch(`${API}/api/atlas/kpis`).then(r => r.json()).then(setKpis).catch(() => {})
    fetch(`${API}/api/atlas/dq`).then(r => r.json()).then(setDq).catch(() => {})
    fetch(`${API}/api/atlas/lineage`).then(r => r.json()).then(setLineage).catch(() => {})
    fetch(`${API}/api/atlas/customers`).then(r => r.json()).then(setCustomers).catch(() => {})
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🌍</span>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: DARK }}>Atlas Voyages</h2>
              <p className="text-sm text-gray-400">Demo Travel Agency — DERTOUR Meridian Reference Implementation</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">● LIVE</span>
          <span className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-600">Snowflake + AWS</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'governance', label: '🛡️ Governance' },
          { id: 'lineage', label: '🔗 Lineage' },
          { id: 'security', label: '🔐 Security' },
          { id: 'ingestion', label: '📥 Ingestion' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-md text-xs font-medium transition-all flex-1"
            style={{ background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? DARK : '#999',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <KPI label="Total Bookings" value={kpis?.total_bookings?.toLocaleString() || '—'} color={BLUE} />
              <KPI label="Revenue" value={kpis ? `£${(kpis.total_revenue/1000).toFixed(0)}K` : '—'} color="#10B981" />
              <KPI label="Avg Booking" value={kpis ? `£${kpis.avg_value?.toLocaleString()}` : '—'} color={BLUE} />
              <KPI label="Customers" value={kpis?.unique_customers?.toLocaleString() || '—'} color="#8B5CF6" />
              <KPI label="Cancellations" value={kpis?.cancellations?.toLocaleString() || '—'} color="#EF4444" />
            </div>
          </div>

          {/* Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Bronze Layer" icon="🥉" color="#CD7F32">
              <p className="text-xs text-gray-500 mb-2">Raw data — append only, schema-on-read</p>
              <div className="space-y-1">
                <p className="text-xs"><span className="font-mono text-blue-600">RAW_BOOKINGS</span> · 500 rows</p>
                <p className="text-xs"><span className="font-mono text-blue-600">RAW_CUSTOMERS</span> · 200 rows</p>
              </div>
              <p className="text-[10px] text-gray-300 mt-2">Metadata: _LOAD_TIMESTAMP, _SOURCE, _LINEAGE_ID</p>
            </Card>
            <Card title="Silver Layer" icon="🥈" color="#C0C0C0">
              <p className="text-xs text-gray-500 mb-2">Cleaned, typed, deduplicated</p>
              <div className="space-y-1">
                <p className="text-xs">• Null handling applied</p>
                <p className="text-xs">• Data types enforced</p>
                <p className="text-xs">• Business keys resolved</p>
              </div>
              <p className="text-[10px] text-gray-300 mt-2">Transform: dbt staging models</p>
            </Card>
            <Card title="Gold Layer" icon="🥇" color="#FFD700">
              <p className="text-xs text-gray-500 mb-2">Star schema — business-ready</p>
              <div className="space-y-1">
                <p className="text-xs"><span className="font-mono text-blue-600">V_BOOKING_KPIS</span> · Executive KPIs</p>
                <p className="text-xs"><span className="font-mono text-blue-600">V_DQ_SCORES</span> · Data quality</p>
                <p className="text-xs"><span className="font-mono text-blue-600">V_LINEAGE</span> · Provenance</p>
                <p className="text-xs"><span className="font-mono text-blue-600">V_CUSTOMERS_MASKED</span> · PII masked</p>
              </div>
            </Card>
          </div>

          {/* Tech Stack */}
          <Card title="Technology Stack" icon="⚡" color={BLUE}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Snowflake', desc: 'Warehouse + Cortex AI', color: '#29B5E8' },
                { name: 'dbt', desc: 'Transform + tests', color: '#FF694A' },
                { name: 'Airflow (MWAA)', desc: 'Orchestration', color: '#8B5CF6' },
                { name: 'Terraform', desc: 'IaC — all provisioned', color: '#7B42BC' },
                { name: 'Snowpipe', desc: 'Real-time S3 ingest', color: '#29B5E8' },
                { name: 'GitHub Actions', desc: 'CI/CD pipeline', color: DARK },
                { name: 'Service Principal', desc: 'Key-pair auth', color: '#F59E0B' },
                { name: 'AWS S3', desc: 'Data landing zone', color: '#FF9900' },
              ].map(t => (
                <div key={t.name} className="rounded-lg p-3 border border-gray-100">
                  <div className="w-2 h-2 rounded-full mb-2" style={{ background: t.color }} />
                  <p className="text-xs font-bold" style={{ color: DARK }}>{t.name}</p>
                  <p className="text-[10px] text-gray-400">{t.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* GOVERNANCE TAB */}
      {tab === 'governance' && (
        <div className="space-y-4">
          <Card title="Data Quality Scores" icon="📊" color="#10B981">
            {dq.map(d => (
              <DQBar key={d.table_name} label={`${d.table_name} (${d.total_rows?.toLocaleString()} rows)`} score={d.dq_score || 100} />
            ))}
            <p className="text-[10px] text-gray-400 mt-2">Checks: null IDs, negative values, type validation. Enforced via dbt tests in CI/CD.</p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Governance Policies" icon="📋" color={BLUE}>
              <div className="space-y-2">
                {[
                  { policy: 'PII Classification', status: '✅ Active', desc: '_PII_CLASSIFIED flag on customer tables' },
                  { policy: 'Dynamic Masking', status: '✅ Active', desc: 'V_CUSTOMERS_MASKED view hides email + surname' },
                  { policy: 'Row-Level Security', status: '🔨 Planned', desc: 'Brand isolation — users see only their brand data' },
                  { policy: 'Column-Level Security', status: '🔨 Planned', desc: 'Financial fields restricted to WRITER role' },
                  { policy: 'Data Retention', status: '✅ Active', desc: 'Time Travel: 7 days. Archive: S3 Glacier after 1 year' },
                  { policy: 'Audit Trail', status: '✅ Active', desc: '_LOAD_TIMESTAMP + _LINEAGE_ID on every record' },
                ].map(p => (
                  <div key={p.policy} className="flex items-start gap-2 py-1 border-b border-gray-50">
                    <span className="text-xs">{p.status}</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: DARK }}>{p.policy}</p>
                      <p className="text-[10px] text-gray-400">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Service Principals" icon="🔐" color="#F59E0B">
              <div className="space-y-2">
                {[
                  { name: 'sf-atlas-reader', type: 'Snowflake', scope: 'Read GOLD layer', auth: 'Key-pair' },
                  { name: 'sf-atlas-writer', type: 'Snowflake', scope: 'Write all layers', auth: 'Key-pair' },
                  { name: 'aws-atlas-ingest', type: 'AWS IAM', scope: 'S3 read + SQS', auth: 'Assume role' },
                  { name: 'gh-atlas-deploy', type: 'GitHub', scope: 'CI/CD + Terraform', auth: 'OIDC' },
                  { name: 'mwaa-atlas-exec', type: 'AWS IAM', scope: 'Airflow execution', auth: 'IAM role' },
                ].map(sp => (
                  <div key={sp.name} className="flex items-center gap-3 py-1.5 border-b border-gray-50">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-700 font-mono">{sp.name}</span>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-600">{sp.scope}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">{sp.auth}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3">No human credentials in automation. All service principals auditable + rotatable.</p>
            </Card>
          </div>
        </div>
      )}

      {/* LINEAGE TAB */}
      {tab === 'lineage' && (
        <div className="space-y-4">
          <Card title="Data Provenance — Where Did This Data Come From?" icon="🔗" color="#8B5CF6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Batch ID', 'Source', 'Records', 'First Load', 'Last Load'].map(h => (
                      <th key={h} className="text-left text-[10px] uppercase tracking-wider text-gray-400 py-2 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineage.slice(0, 15).map((l, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-2 text-xs font-mono text-blue-600">{l.batch_id}</td>
                      <td className="py-2 px-2"><span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700">{l.source}</span></td>
                      <td className="py-2 px-2 text-xs font-bold">{l.records}</td>
                      <td className="py-2 px-2 text-xs text-gray-400">{l.first_load?.substring(0, 19)}</td>
                      <td className="py-2 px-2 text-xs text-gray-400">{l.last_load?.substring(0, 19)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-400 mt-3">Every record has _LINEAGE_ID tracking its ingestion batch. Full audit trail from source to Gold.</p>
          </Card>

          <Card title="Lineage Flow" icon="🔀" color={BLUE}>
            <div className="flex items-center justify-between text-center py-4">
              {[
                { label: 'S3 Landing Zone', sub: 'dertour-atlas-voyages-data-prod', icon: '🪣', color: '#FF9900' },
                { label: 'Snowpipe', sub: 'Auto-ingest on file arrival', icon: '📥', color: '#29B5E8' },
                { label: 'Bronze', sub: 'Raw + metadata tags', icon: '🥉', color: '#CD7F32' },
                { label: 'dbt Transform', sub: 'Clean, type, test', icon: '⚙️', color: '#FF694A' },
                { label: 'Gold Views', sub: 'Business-ready', icon: '🥇', color: '#FFD700' },
                { label: 'Consumers', sub: 'BI, AI, API', icon: '📊', color: '#10B981' },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  <div className="flex-1">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <p className="text-xs font-bold" style={{ color: s.color }}>{s.label}</p>
                    <p className="text-[10px] text-gray-400">{s.sub}</p>
                  </div>
                  {i < 5 && <span className="text-gray-300 text-lg mx-1">→</span>}
                </React.Fragment>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* SECURITY TAB */}
      {tab === 'security' && (
        <div className="space-y-4">
          <Card title="PII Masking Demo — Customer Data" icon="🔐" color={RED}>
            <p className="text-xs text-gray-500 mb-3">ATLAS_VOYAGES_GOLD.V_CUSTOMERS_MASKED — PII fields automatically masked for READER role</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['ID', 'First Name', 'Last Name', 'Email', 'Segment', 'Tier', 'PII?'].map(h => (
                      <th key={h} className="text-left text-[10px] uppercase tracking-wider text-gray-400 py-2 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 10).map((c, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 px-2 text-xs font-mono">{c.customer_id}</td>
                      <td className="py-2 px-2 text-xs">{c.first_name}</td>
                      <td className="py-2 px-2 text-xs text-red-500 font-mono">{c.last_name_masked}</td>
                      <td className="py-2 px-2 text-xs text-red-500 font-mono">{c.email_masked}</td>
                      <td className="py-2 px-2"><span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-600">{c.segment}</span></td>
                      <td className="py-2 px-2"><span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-50 text-yellow-600">{c.loyalty_tier}</span></td>
                      <td className="py-2 px-2"><span className="text-[10px] text-red-500">🔒 Yes</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-red-700">⚠️ <strong>PII Policy:</strong> Last name + email masked for READER role. Only WRITER role sees full data. Cross-brand PII sharing prohibited (Thompson legal constraint).</p>
            </div>
          </Card>

          <Card title="RBAC Roles" icon="👤" color={BLUE}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { role: 'ATLAS_VOYAGES_READER', access: 'Gold layer (SELECT only)', sees: 'Masked PII', color: '#10B981' },
                { role: 'ATLAS_VOYAGES_WRITER', access: 'All layers (CRUD)', sees: 'Full PII', color: '#F59E0B' },
                { role: 'SYSADMIN', access: 'Schema + grants', sees: 'Full access', color: '#EF4444' },
              ].map(r => (
                <div key={r.role} className="rounded-lg p-3 border-2" style={{ borderColor: r.color + '44' }}>
                  <p className="text-xs font-mono font-bold" style={{ color: r.color }}>{r.role}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{r.access}</p>
                  <p className="text-[10px] text-gray-400">PII: {r.sees}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* INGESTION TAB */}
      {tab === 'ingestion' && (
        <div className="space-y-4">
          <Card title="Data Mesh Ingestion Patterns" icon="📥" color={BLUE}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { pattern: 'Snowpipe (Event-driven)', desc: 'Brand drops files in S3 → SQS notification → Snowpipe auto-loads to Bronze. Zero code, real-time.', when: 'File-based data: CSV, JSON, Parquet exports from brand systems', status: '✅ Active', color: '#29B5E8' },
                { pattern: 'Snowpipe Streaming (API)', desc: 'Brand microservice calls Snowflake Streaming API directly. Sub-second latency. SDK-based.', when: 'Real-time events: bookings, clicks, availability changes', status: '🔨 Phase 2', color: '#8B5CF6' },
                { pattern: 'Airflow DAG (Scheduled)', desc: 'MWAA DAG queries brand AWS RDS/DynamoDB on schedule. Writes to Bronze. Full orchestration.', when: 'Batch loads: nightly full refresh, hourly incremental', status: '✅ Active', color: '#FF694A' },
              ].map(p => (
                <div key={p.pattern} className="rounded-xl p-4 border-2" style={{ borderColor: p.color + '33', background: p.color + '08' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold" style={{ color: p.color }}>{p.pattern}</h4>
                    <span className="text-[10px]">{p.status}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{p.desc}</p>
                  <p className="text-[10px] text-gray-400"><strong>When:</strong> {p.when}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Atlas Voyages Ingestion Pipeline" icon="🔄" color={DARK}>
            <div className="flex items-center justify-between py-3">
              {[
                { label: 'Brand App (AWS)', desc: 'Booking microservice', color: '#FF9900' },
                { label: 'S3 Landing', desc: 'raw/bookings/*.json', color: '#FF9900' },
                { label: 'SQS Event', desc: 'ObjectCreated trigger', color: '#8B5CF6' },
                { label: 'Snowpipe', desc: 'Auto-ingest <1min', color: '#29B5E8' },
                { label: 'Bronze Table', desc: '+ metadata tags', color: '#CD7F32' },
                { label: 'Airflow DQ', desc: 'Quality checks', color: '#FF694A' },
                { label: 'Gold View', desc: 'Business-ready', color: '#FFD700' },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  <div className="text-center flex-1">
                    <div className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-xs font-bold" style={{ background: s.color }}>{i + 1}</div>
                    <p className="text-[10px] font-bold" style={{ color: s.color }}>{s.label}</p>
                    <p className="text-[9px] text-gray-400">{s.desc}</p>
                  </div>
                  {i < 6 && <span className="text-gray-300 text-sm">→</span>}
                </React.Fragment>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">End-to-end: brand writes file → data appears in Gold view. No human intervention. Service principal auth at every step.</p>
          </Card>
        </div>
      )}
    </div>
  )
}
