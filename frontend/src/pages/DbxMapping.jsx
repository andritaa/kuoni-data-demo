import React, { useState } from 'react'

const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'
const DBX_ORANGE = '#FF3621'
const DBX_DARK = '#1C2536'
const SF_BLUE = '#29B5E8'

const mappings = [
  {
    category: 'Compute',
    items: [
      { dbx: 'All-Purpose Cluster', sf: 'Virtual Warehouse (XL)', dbxIcon: '🔷', sfIcon: '❄️', notes: 'Both auto-scale. Snowflake auto-suspends by default — key cost advantage. No cluster management overhead.', transferability: 'direct' },
      { dbx: 'Job Cluster', sf: 'Dedicated Warehouse (scheduled)', dbxIcon: '⚙️', sfIcon: '❄️', notes: 'Create separate warehouse per job type. Use RESUME_AT / SUSPEND_AFTER for cost control.', transferability: 'direct' },
      { dbx: 'SQL Warehouse (Serverless)', sf: 'Snowsight / Serverless Compute', dbxIcon: '💻', sfIcon: '❄️', notes: 'Both offer serverless SQL. Snowflake bundles this into standard warehouses — simpler pricing.', transferability: 'direct' },
      { dbx: 'Photon Engine', sf: 'Snowflake Native Compute', dbxIcon: '⚡', sfIcon: '⚡', notes: 'Both use vectorised execution. Photon is an add-on; Snowflake compute optimisation is built-in.', transferability: 'conceptual' },
    ]
  },
  {
    category: 'Storage & Tables',
    items: [
      { dbx: 'Delta Lake', sf: 'Snowflake Tables / Iceberg', dbxIcon: '🔺', sfIcon: '❄️', notes: 'Both support ACID transactions and time travel. Snowflake supports Iceberg tables for open format interop. Delta Sharing ↔ Snowflake Data Sharing.', transferability: 'direct' },
      { dbx: 'Delta Table (Time Travel)', sf: 'Time Travel (90 days)', dbxIcon: '⏱️', sfIcon: '⏱️', notes: 'Identical concept. Snowflake supports up to 90 days. Syntax: SELECT * FROM table AT(OFFSET => -3600)', transferability: 'direct' },
      { dbx: 'DBFS / Unity Catalog Volumes', sf: 'Stages (Internal/External)', dbxIcon: '📁', sfIcon: '📁', notes: 'Snowflake Stages = file storage for load/unload. External stages on S3/Azure Blob/GCS. Named stages are reusable.', transferability: 'direct' },
      { dbx: 'Managed Tables', sf: 'Standard Tables', dbxIcon: '📊', sfIcon: '📊', notes: 'Direct equivalent. Snowflake handles clustering, micro-partitioning, and compression automatically.', transferability: 'direct' },
    ]
  },
  {
    category: 'Ingestion & Streaming',
    items: [
      { dbx: 'Auto Loader', sf: 'Snowpipe', dbxIcon: '🔄', sfIcon: '🔄', notes: 'Both detect and ingest new files automatically. Snowpipe uses SQS/SNS notifications. Snowpipe Streaming API for sub-second latency.', transferability: 'direct' },
      { dbx: 'Structured Streaming', sf: 'Snowpipe Streaming / Dynamic Tables', dbxIcon: '🌊', sfIcon: '🌊', notes: 'Snowflake Dynamic Tables are a powerful equivalent — declarative, no micro-batch management, automatic refresh.', transferability: 'direct' },
      { dbx: 'Kafka Connector', sf: 'Snowflake Kafka Connector', dbxIcon: '📡', sfIcon: '📡', notes: 'Both have official Kafka connectors. Identical architecture — connector writes Avro/JSON directly to Snowflake tables.', transferability: 'direct' },
    ]
  },
  {
    category: 'Transformation & Orchestration',
    items: [
      { dbx: 'Databricks Jobs / Workflows', sf: 'Tasks + Streams + DAGs', dbxIcon: '🔁', sfIcon: '🔁', notes: 'Snowflake Tasks support DAG orchestration natively. Streams provide CDC (change data capture) for incremental processing.', transferability: 'conceptual' },
      { dbx: 'Notebooks', sf: 'Snowsight Notebooks', dbxIcon: '📓', sfIcon: '📓', notes: 'Snowsight added native notebooks in 2024. Support Python and SQL. Less mature than Databricks notebooks but improving rapidly.', transferability: 'direct' },
      { dbx: 'dbt on Databricks', sf: 'dbt on Snowflake', dbxIcon: '⚙️', sfIcon: '⚙️', notes: 'Identical dbt experience — just change the profile. Snowflake is dbt\'s primary target platform. All adapters, macros, and packages work.', transferability: 'direct' },
    ]
  },
  {
    category: 'Governance & Cataloguing',
    items: [
      { dbx: 'Unity Catalog', sf: 'Snowflake Data Governance + Object Tagging', dbxIcon: '🗂️', sfIcon: '🔐', notes: 'Unity Catalog is more mature for cross-workspace governance. Snowflake offers Object Tagging, Row Access Policies, Dynamic Data Masking, and Snowflake Horizon.', transferability: 'partial' },
      { dbx: 'Column-level Access Control', sf: 'Column-level Security + Dynamic Masking', dbxIcon: '🔒', sfIcon: '🔒', notes: 'Direct equivalent. Snowflake Dynamic Data Masking shows masked values to unprivileged users — no query rewrite needed.', transferability: 'direct' },
      { dbx: 'Lineage (Unity Catalog)', sf: 'Access History + Partner Tools (Atlan)', dbxIcon: '📈', sfIcon: '📈', notes: 'Snowflake Access History tracks all object access. For visual lineage, connect Atlan or Alation via Snowflake partner connect.', transferability: 'partial' },
    ]
  },
  {
    category: 'ML & AI',
    items: [
      { dbx: 'MLflow', sf: 'Snowflake ML + Model Registry', dbxIcon: '🧪', sfIcon: '🧠', notes: 'Snowflake ML (Snowpark) supports Python-based ML workflows. Model Registry added 2024. Less mature than MLflow but no data movement required.', transferability: 'conceptual' },
      { dbx: 'Feature Store', sf: 'Feature Store (preview)', dbxIcon: '🏪', sfIcon: '🏪', notes: 'Snowflake Feature Store released 2024 — similar concept. Entities, features, and spine tables for training/serving.', transferability: 'direct' },
      { dbx: 'Serverless Inference', sf: 'Snowflake Cortex (LLM functions)', dbxIcon: '🤖', sfIcon: '🤖', notes: 'Snowflake Cortex provides LLM functions (COMPLETE, SUMMARIZE, CLASSIFY) — run AI directly in SQL with no model deployment.', transferability: 'conceptual' },
    ]
  },
  {
    category: 'Sharing & Marketplace',
    items: [
      { dbx: 'Delta Sharing', sf: 'Snowflake Data Sharing / Marketplace', dbxIcon: '🤝', sfIcon: '🤝', notes: 'Both enable zero-copy data sharing. Snowflake\'s Data Marketplace is the more established ecosystem — 2,000+ datasets available.', transferability: 'direct' },
    ]
  },
]

const colors = { direct: {bg:'#D1FAE5',text:'#065F46',label:'✅ Direct Equivalent'}, partial: {bg:'#FEF3C7',text:'#92400E',label:'⚠️ Partial — Adapt'}, conceptual: {bg:'#DBEAFE',text:'#1E40AF',label:'💡 Conceptual — Rethink'} }

export default function DbxMapping() {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const allItems = mappings.flatMap(m => m.items.map(i => ({...i, category: m.category})))
  const filtered = filter === 'all' ? allItems : allItems.filter(i => i.transferability === filter)

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="rounded-xl p-6 mb-6 text-white" style={{background: `linear-gradient(135deg, ${DBX_DARK} 0%, ${TEAL} 100%)`}}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">⚡ Databricks → ❄️ Snowflake</h1>
            <p className="text-white/80 mb-4">A practitioner's capability mapping. Every Databricks concept you know has a Snowflake equivalent — here's how they map, and where to watch out.</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(colors).map(([key, c]) => (
                <span key={key} className="text-xs px-3 py-1 rounded-full font-medium" style={{background:c.bg,color:c.text}}>{c.label}</span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">Total mappings</p>
            <p className="text-4xl font-bold" style={{color:GOLD}}>{allItems.length}</p>
            <p className="text-white/60 text-xs mt-1">across {mappings.length} categories</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[['all','All Mappings'],['direct','✅ Direct'],['partial','⚠️ Adapt'],['conceptual','💡 Rethink']].map(([val,label])=>(
          <button key={val} onClick={()=>setFilter(val)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all border"
            style={{
              background: filter===val ? TEAL : 'white',
              color: filter===val ? 'white' : TEAL,
              borderColor: TEAL,
            }}>{label} {val!=='all' && `(${allItems.filter(i=>i.transferability===val).length})`}</button>
        ))}
      </div>

      {/* Mapping table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr style={{background:TEAL}}>
              <th className="text-left py-3 px-4 text-xs font-semibold text-white uppercase">Category</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-white uppercase">⚡ Databricks</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-white uppercase">❄️ Snowflake</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-white uppercase">Transferability</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-white uppercase hidden lg:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const c = colors[item.transferability]
              const isExpanded = expanded === i
              return (
                <React.Fragment key={i}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onClick={()=>setExpanded(isExpanded?null:i)}>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{background:'#EBF4F8',color:TEAL}}>{item.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span>{item.dbxIcon}</span>
                        <span className="text-sm font-medium" style={{color:DBX_ORANGE}}>{item.dbx}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span>{item.sfIcon}</span>
                        <span className="text-sm font-medium" style={{color:SF_BLUE}}>{item.sf}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{background:c.bg,color:c.text}}>{c.label}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <p className="text-xs text-gray-600 max-w-sm">{item.notes}</p>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="lg:hidden">
                      <td colSpan={4} className="px-4 pb-3 pt-0">
                        <div className="rounded-lg p-3 text-xs text-gray-700" style={{background:'#F8F6F3'}}>
                          <strong>Notes:</strong> {item.notes}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Key Talking Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider" style={{color:TEAL}}>🎯 My Databricks Experience — Applied to Snowflake</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            {[
              'Medallion architecture (Bronze/Silver/Gold) is identical in both platforms — my patterns transfer directly',
              'dbt workflows I\'ve built on Databricks work on Snowflake with only a profile change',
              'Delta Lake time travel = Snowflake time travel — same capability, simpler syntax in Snowflake',
              'Unity Catalog governance patterns map to Snowflake\'s RBAC + Dynamic Masking model',
              'Streaming ingestion patterns (Auto Loader → Snowpipe) are conceptually identical',
              'The main shift: Snowflake is SQL-first, managed compute — no cluster management overhead',
            ].map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{color:GOLD}} className="mt-0.5 flex-shrink-0">→</span>{point}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider" style={{color:TEAL}}>⚠️ Watch Points — Key Differences</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            {[
              'No native Python-first experience in Snowflake — Snowpark is maturing but Databricks notebooks are richer',
              'Snowflake warehouses are per-query cost (credits) not cluster uptime — cost model needs recalibration',
              'No equivalent to Databricks Repos/Git integration natively — use dbt Cloud or external CI/CD',
              'ML/MLflow workflows require Snowpark ML — less mature, but zero data movement is a big advantage',
              'Snowflake Tasks/Streams are powerful but more complex than Databricks Workflows UI',
              'Unity Catalog is ahead of Snowflake for cross-platform governance — flag this as a watch point',
            ].map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>{point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
