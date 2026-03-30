import React, { useState } from 'react'

const BLUE = '#E40028'
const DARK = '#32373C'
const GOLD = '#FAD73C'
const TEAL = '#0058A3'

const brands = [
  { name: 'Inghams', status: 'live', icon: '🎿', aws: true, snowflake: true, dbt: true, airflow: true, d365: false },
  { name: 'Explore', status: 'ready', icon: '🌍', aws: false, snowflake: false, dbt: false, airflow: false, d365: false },
  { name: "Santa's Lapland", status: 'ready', icon: '🎅', aws: false, snowflake: false, dbt: false, airflow: false, d365: false },
  { name: 'Inntravel', status: 'ready', icon: '🚶', aws: false, snowflake: false, dbt: false, airflow: false, d365: false },
  { name: 'Kuoni', status: 'ready', icon: '✈️', aws: false, snowflake: false, dbt: false, airflow: false, d365: false },
]

const pipeline = [
  { step: 1, name: 'Terraform Plan', desc: 'AWS: S3 bucket, SQS queue, IAM role\nSnowflake: schemas, warehouse, RBAC', icon: '🏗️', time: '~2 min', color: TEAL },
  { step: 2, name: 'Terraform Apply', desc: 'Infrastructure created in AWS + Snowflake\nStorage integration configured', icon: '✅', time: '~3 min', color: '#10B981' },
  { step: 3, name: 'dbt Models', desc: 'Staging: stg_{brand}_bookings\nMarts: fct_{brand}_bookings\nTests auto-generated', icon: '⚙️', time: '~1 min', color: '#7B42BC' },
  { step: 4, name: 'Airflow DAG', desc: 'S3 → Bronze → DQ checks → Gold\nDeployed to MWAA automatically', icon: '🔄', time: '~1 min', color: '#FF694A' },
  { step: 5, name: 'CI/CD Pipeline', desc: 'GitHub Actions runs all steps\nPR = plan+test, Merge = deploy', icon: '🚀', time: 'Automated', color: DARK },
]

const awsResources = [
  { name: 'S3 Bucket', detail: 'dertour-{brand}-data-prod', icon: '🪣' },
  { name: 'SQS Queue', detail: 'Snowpipe notifications', icon: '📨' },
  { name: 'IAM Role', detail: 'Cross-account Snowflake access', icon: '🔐' },
]

const sfResources = [
  { name: 'Bronze Schema', detail: '{BRAND}_BRONZE — raw data', icon: '🥉' },
  { name: 'Silver Schema', detail: '{BRAND}_SILVER — cleaned', icon: '🥈' },
  { name: 'Gold Schema', detail: '{BRAND}_GOLD — star schema', icon: '🥇' },
  { name: 'Warehouse', detail: '{BRAND}_WH — X-Small, auto-suspend', icon: '⚡' },
  { name: 'Roles', detail: '{BRAND}_READER + {BRAND}_WRITER', icon: '👤' },
]

function Tick({ on }) {
  return <span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: 6, background: on ? '#10B981' : '#e5e7eb', color: on ? '#fff' : '#999', textAlign: 'center', lineHeight: '24px', fontSize: 14, fontWeight: 700 }}>{on ? '✓' : '–'}</span>
}

export default function BrandOnboard() {
  const [selected, setSelected] = useState('Inghams')
  const [simStep, setSimStep] = useState(0)
  const [running, setRunning] = useState(false)

  const simulate = () => {
    setRunning(true)
    setSimStep(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      setSimStep(step)
      if (step >= pipeline.length) {
        clearInterval(interval)
        setRunning(false)
      }
    }, 1500)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: DARK }}>Brand Onboarding</h2>
        <p className="text-gray-500 text-sm">IaC + CI/CD: AWS → Snowflake → dbt → Airflow · 15 minutes per brand</p>
      </div>

      {/* Brand Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {brands.map(b => (
          <div key={b.name} onClick={() => setSelected(b.name)}
            className="bg-white rounded-xl p-4 border-2 shadow-sm cursor-pointer transition-all hover:shadow-md"
            style={{ borderColor: selected === b.name ? TEAL : '#e5e7eb' }}>
            <div className="text-2xl mb-2">{b.icon}</div>
            <h3 className="text-sm font-bold" style={{ color: DARK }}>{b.name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${b.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {b.status === 'live' ? '● LIVE' : '○ Ready to onboard'}
            </span>
            <div className="flex gap-1 mt-2">
              <Tick on={b.aws} /><Tick on={b.snowflake} /><Tick on={b.dbt} /><Tick on={b.airflow} /><Tick on={b.d365} />
            </div>
            <div className="flex gap-1 mt-1">
              {['AWS','SF','dbt','Air','D365'].map(l => <span key={l} className="text-[8px] text-gray-400 w-6 text-center">{l}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Simulation */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: DARK }}>Onboarding Pipeline</h3>
          <button onClick={simulate} disabled={running}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
            style={{ background: running ? '#999' : TEAL }}>
            {running ? '⏳ Running...' : '▶ Simulate Onboarding'}
          </button>
        </div>
        <div className="flex items-start gap-2">
          {pipeline.map((p, i) => (
            <React.Fragment key={p.step}>
              <div className={`flex-1 rounded-xl p-4 border-2 transition-all duration-500 ${simStep >= p.step ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{simStep >= p.step ? '✅' : p.icon}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: simStep >= p.step ? '#10B981' : DARK }}>{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.time}</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 whitespace-pre-line">{p.desc}</p>
              </div>
              {i < pipeline.length - 1 && <div className="text-gray-300 text-lg mt-6">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* What Gets Created */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#FF9900' }}>☁️ AWS Resources</h3>
          {awsResources.map(r => (
            <div key={r.name} className="flex items-center gap-3 py-2 border-b border-gray-50">
              <span>{r.icon}</span>
              <div>
                <p className="text-xs font-bold" style={{ color: DARK }}>{r.name}</p>
                <p className="text-[10px] text-gray-400 font-mono">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#29B5E8' }}>❄️ Snowflake Resources</h3>
          {sfResources.map(r => (
            <div key={r.name} className="flex items-center gap-3 py-2 border-b border-gray-50">
              <span>{r.icon}</span>
              <div>
                <p className="text-xs font-bold" style={{ color: DARK }}>{r.name}</p>
                <p className="text-[10px] text-gray-400 font-mono">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-gray-800 text-xs text-gray-400 font-mono flex items-center justify-between">
          <span>terraform/brands/inghams/main.tf</span>
          <span className="text-green-400">● GitHub: andritaa/kuoni-data-demo</span>
        </div>
        <pre className="px-5 py-4 text-xs text-green-400 bg-gray-900 overflow-x-auto font-mono leading-relaxed">{`module "aws" {
  source = "../../modules/brand-aws"
  brand  = "inghams"
}

module "snowflake" {
  source        = "../../modules/brand-snowflake"
  brand         = "inghams"
  aws_s3_bucket = module.aws.s3_bucket
  aws_role_arn  = module.aws.snowflake_role_arn
  aws_sqs_arn   = module.aws.sqs_queue_arn
}

# To onboard a new brand:
# 1. Copy this folder
# 2. Change "inghams" to your brand name
# 3. PR → merge → auto-deployed`}</pre>
      </div>
    </div>
  )
}
