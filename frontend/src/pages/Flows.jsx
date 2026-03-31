import React, { useState, useEffect, useRef } from 'react'

const DARK = '#32373C'
const RED = '#E40028'
const BLUE = '#0058A3'

// ─── Animated particle along a path ──────────────────────
function AnimatedParticle({ path, color, duration = 3, delay = 0 }) {
  const ref = useRef(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let frame
    let start = null
    const animate = (ts) => {
      if (!start) start = ts + delay * 1000
      if (ts < start) { frame = requestAnimationFrame(animate); return }
      const elapsed = ((ts - start) % (duration * 1000)) / (duration * 1000)
      setOffset(elapsed)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [duration, delay])

  if (!path) return null
  return (
    <circle r={4} fill={color} opacity={0.8}>
      <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`}>
        <mpath href={`#${path}`} />
      </animateMotion>
    </circle>
  )
}

// ─── Glowing animated connection ─────────────────────────
function FlowPath({ id, d, color, width = 2, animated = true, label = '' }) {
  return (
    <g>
      {/* Shadow */}
      <path d={d} fill="none" stroke={color} strokeWidth={width + 4} opacity={0.08} />
      {/* Main path */}
      <path id={id} d={d} fill="none" stroke={color} strokeWidth={width} opacity={0.5}
        strokeLinecap="round" />
      {/* Animated dash overlay */}
      {animated && (
        <path d={d} fill="none" stroke={color} strokeWidth={width + 1} opacity={0.3}
          strokeDasharray="8 16" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1s" repeatCount="indefinite" />
        </path>
      )}
      {/* Particle */}
      {animated && <AnimatedParticle path={id} color={color} duration={3} delay={Math.random() * 2} />}
      {/* Label */}
      {label && (
        <text>
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle" fontSize={7} fill={color} fontWeight="600" dy={-8}>
            {label}
          </textPath>
        </text>
      )}
    </g>
  )
}

// ─── Fancy node ──────────────────────────────────────────
function Node({ x, y, w, h, label, sublabel, icon, color, pulse, onClick, active = true }) {
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', opacity: active ? 1 : 0.3, transition: 'opacity 0.3s' }}>
      {pulse && (
        <rect x={x-2} y={y-2} width={w+4} height={h+4} rx={14} fill={color} opacity={0.15}>
          <animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite" />
        </rect>
      )}
      <rect x={x} y={y} width={w} height={h} rx={12} fill="#fff" stroke={color} strokeWidth={2} />
      <rect x={x} y={y} width={w} height={4} rx={2} fill={color} />
      {icon && <text x={x + w/2} y={y + h/2 - 2} textAnchor="middle" fontSize={18}>{icon}</text>}
      <text x={x + w/2} y={y + h/2 + (icon ? 12 : 2)} textAnchor="middle" fontSize={9} fontWeight="700" fill={DARK}>{label}</text>
      {sublabel && <text x={x + w/2} y={y + h/2 + (icon ? 22 : 12)} textAnchor="middle" fontSize={7} fill="#999">{sublabel}</text>}
    </g>
  )
}

// ═══════════════════════════════════════════════════════════
// VIEW 1: DATA FLOW — AWS → Airflow → Snowflake → dbt → BI
// ═══════════════════════════════════════════════════════════
function DataFlow({ selected, setSelected }) {
  return (
    <svg viewBox="0 0 1200 700" className="w-full" style={{ minHeight: 450 }}>
      {/* Background gradient */}
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFF7ED" />
          <stop offset="50%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#ECFDF5" />
        </linearGradient>
      </defs>
      <rect width="1200" height="700" fill="url(#bg)" rx="12" />

      {/* Title */}
      <text x={600} y={30} textAnchor="middle" fontSize={14} fontWeight="800" fill={DARK}>DATA FLOW — Brand Product → Snowflake → Intelligence</text>

      {/* === SOURCE COLUMN === */}
      <text x={90} y={65} textAnchor="middle" fontSize={10} fontWeight="700" fill="#FF9900">SOURCES</text>
      <Node x={20} y={80} w={140} h={65} icon="🎿" label="Inghams" sublabel="AWS Microservices" color="#FF9900" pulse />
      <Node x={20} y={160} w={140} h={65} icon="🎅" label="Santa's Lapland" sublabel="AWS / Azure" color="#FF9900" />
      <Node x={20} y={240} w={140} h={65} icon="🌍" label="Explore" sublabel="AWS Services" color="#FF9900" />
      <Node x={20} y={320} w={140} h={65} icon="🟦" label="Dynamics 365" sublabel="Dataverse" color="#0078D4" />
      <Node x={20} y={400} w={140} h={65} icon="📞" label="Telephony" sublabel="Call centre data" color="#6B7280" />

      {/* === INGEST COLUMN === */}
      <text x={310} y={65} textAnchor="middle" fontSize={10} fontWeight="700" fill="#8B5CF6">INGEST</text>
      <Node x={240} y={120} w={140} h={70} icon="🔄" label="Airflow (MWAA)" sublabel="DAGs per brand" color="#8B5CF6" pulse />
      <Node x={240} y={220} w={140} h={55} icon="📥" label="Snowpipe" sublabel="Real-time S3→SF" color="#29B5E8" />
      <Node x={240} y={300} w={140} h={55} icon="🔌" label="Dataverse" sublabel="Native connector" color="#0078D4" />
      <Node x={240} y={380} w={140} h={55} icon="📊" label="Snowpipe API" sublabel="Direct API ingest" color="#6B7280" />

      {/* === SNOWFLAKE COLUMN === */}
      <text x={555} y={65} textAnchor="middle" fontSize={10} fontWeight="700" fill="#29B5E8">SNOWFLAKE</text>
      <rect x={460} y={75} width={190} height={370} rx={16} fill="#29B5E8" opacity={0.06} stroke="#29B5E8" strokeWidth={1} strokeDasharray="4 4" />
      <Node x={475} y={90} w={160} h={55} icon="🥉" label="BRONZE" sublabel="Raw — append only" color="#CD7F32" />
      <Node x={475} y={165} w={160} h={55} icon="🥈" label="SILVER" sublabel="Cleaned + typed" color="#C0C0C0" />
      <Node x={475} y={240} w={160} h={55} icon="🥇" label="GOLD" sublabel="Star schema" color="#FFD700" pulse />
      <Node x={475} y={315} w={160} h={55} icon="📦" label="DATA PRODUCTS" sublabel="Self-serve views" color="#10B981" />
      <Node x={475} y={390} w={160} h={55} icon="🧠" label="KNOWLEDGE BASE" sublabel="Vector store + RAG" color="#8B5CF6" />

      {/* === TRANSFORM COLUMN === */}
      <text x={795} y={65} textAnchor="middle" fontSize={10} fontWeight="700" fill="#FF694A">TRANSFORM + AI</text>
      <Node x={720} y={100} w={150} h={60} icon="⚙️" label="dbt" sublabel="Tests + docs + CI/CD" color="#FF694A" pulse />
      <Node x={720} y={185} w={150} h={60} icon="🤖" label="Cortex AI" sublabel="Analyst + Agents" color="#10B981" />
      <Node x={720} y={270} w={150} h={60} icon="🧠" label="MLflow" sublabel="Train + deploy" color="#8B5CF6" />
      <Node x={720} y={355} w={150} h={60} icon="🏗️" label="Terraform" sublabel="IaC — AWS + SF" color="#7B42BC" />

      {/* === CONSUME COLUMN === */}
      <text x={1050} y={65} textAnchor="middle" fontSize={10} fontWeight="700" fill="#10B981">VALUE</text>
      <Node x={970} y={90} w={150} h={55} icon="💰" label="Dynamic Pricing" sublabel="£8M/yr potential" color="#10B981" pulse />
      <Node x={970} y={165} w={150} h={55} icon="📊" label="Power BI" sublabel="Executive dashboards" color="#F2C811" />
      <Node x={970} y={240} w={150} h={55} icon="🤖" label="AI Agents" sublabel="Autonomous insights" color="#8B5CF6" />
      <Node x={970} y={315} w={150} h={55} icon="💬" label="Cortex Analyst" sublabel="Self-service SQL" color="#29B5E8" />
      <Node x={970} y={390} w={150} h={55} icon="🏗️" label="Brand Onboard" sublabel="15 min per brand" color={RED} />

      {/* Animated flow paths */}
      <FlowPath id="f1" d="M 160 112 C 200 112 200 155 240 155" color="#FF9900" label="S3 files" />
      <FlowPath id="f2" d="M 160 192 C 200 192 200 247 240 247" color="#FF9900" />
      <FlowPath id="f3" d="M 160 272 C 200 272 200 247 240 247" color="#FF9900" />
      <FlowPath id="f4" d="M 160 352 C 200 352 200 327 240 327" color="#0078D4" label="Dataverse" />

      <FlowPath id="f5" d="M 380 155 C 420 155 420 117 475 117" color="#8B5CF6" label="Load" />
      <FlowPath id="f6" d="M 380 247 C 420 247 420 117 475 117" color="#29B5E8" />
      <FlowPath id="f7" d="M 380 327 C 420 327 420 117 475 117" color="#0078D4" />

      <FlowPath id="f8" d="M 555 145 C 555 155 555 165 555 165" color="#CD7F32" width={3} />
      <FlowPath id="f9" d="M 555 220 C 555 230 555 240 555 240" color="#C0C0C0" width={3} />
      <FlowPath id="f10" d="M 555 295 C 555 305 555 315 555 315" color="#FFD700" width={3} />

      <FlowPath id="f11" d="M 635 267 C 680 267 680 130 720 130" color="#FFD700" label="dbt run" />
      <FlowPath id="f12" d="M 635 267 C 680 267 680 215 720 215" color="#FFD700" />
      <FlowPath id="f13" d="M 635 267 C 680 267 680 300 720 300" color="#FFD700" />

      <FlowPath id="f14" d="M 870 130 C 920 130 920 117 970 117" color="#FF694A" />
      <FlowPath id="f15" d="M 870 215 C 920 215 920 192 970 192" color="#10B981" label="Insights" />
      <FlowPath id="f16" d="M 870 215 C 920 215 920 267 970 267" color="#10B981" />
      <FlowPath id="f17" d="M 870 300 C 920 300 920 117 970 117" color="#8B5CF6" label="Models" />
      <FlowPath id="f18" d="M 870 385 C 920 385 920 417 970 417" color="#7B42BC" />

      {/* Legend */}
      <g transform="translate(20, 500)">
        <text fontSize={8} fontWeight="700" fill={DARK}>LEGEND</text>
        <circle cx={10} cy={18} r={4} fill="#FF9900" /><text x={20} y={22} fontSize={7} fill="#666">Data flowing</text>
        <rect x={2} y={30} width={16} height={3} fill="#29B5E8" strokeDasharray="4 4" /><text x={20} y={36} fontSize={7} fill="#666">Animated pipeline</text>
        <rect x={2} y={44} width={16} height={10} rx={3} fill="none" stroke="#10B981" strokeWidth={2} /><text x={20} y={52} fontSize={7} fill="#666">Pulsing = active now</text>
      </g>

      {/* Stats */}
      <g transform="translate(900, 490)">
        {[
          { label: 'Brands', value: '10', color: '#FF9900' },
          { label: 'Bookings', value: '26.9K', color: '#29B5E8' },
          { label: 'Revenue', value: '£637M', color: '#10B981' },
          { label: 'DAGs', value: '3', color: '#8B5CF6' },
        ].map((s, i) => (
          <g key={s.label} transform={`translate(${i * 70}, 0)`}>
            <rect width={60} height={40} rx={8} fill={s.color} opacity={0.1} />
            <text x={30} y={18} textAnchor="middle" fontSize={14} fontWeight="800" fill={s.color}>{s.value}</text>
            <text x={30} y={32} textAnchor="middle" fontSize={7} fill="#999">{s.label}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════
// VIEW 2: CI/CD PIPELINE
// ═══════════════════════════════════════════════════════════
function CICDFlow() {
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)

  const stages = [
    { icon: '👨‍💻', label: 'Developer', desc: 'Claude Code\nedit dbt model', color: BLUE, x: 50 },
    { icon: '🔀', label: 'Git Push', desc: 'feature/ branch\nPR created', color: '#6B7280', x: 200 },
    { icon: '🧪', label: 'CI: Test', desc: 'dbt test\nterraform plan\nlint + format', color: '#F59E0B', x: 350 },
    { icon: '👀', label: 'Review', desc: 'Code review\nmin 1 reviewer\napprove', color: '#8B5CF6', x: 500 },
    { icon: '🔀', label: 'Merge', desc: 'Merge to main\ntriggers CD', color: BLUE, x: 650 },
    { icon: '🚀', label: 'CD: Deploy', desc: 'terraform apply\ndbt run (prod)\nDAGs to S3', color: '#10B981', x: 800 },
    { icon: '📊', label: 'Monitor', desc: 'DQ scores\ncost alerts\nfreshness', color: RED, x: 950 },
  ]

  const simulate = () => {
    setRunning(true); setStep(0)
    let s = 0
    const iv = setInterval(() => { s++; setStep(s); if (s >= stages.length) { clearInterval(iv); setRunning(false) } }, 1200)
  }

  return (
    <svg viewBox="0 0 1100 400" className="w-full" style={{ minHeight: 300 }}>
      <defs>
        <linearGradient id="cibg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#ECFDF5" />
        </linearGradient>
      </defs>
      <rect width="1100" height="400" fill="url(#cibg)" rx="12" />
      <text x={550} y={30} textAnchor="middle" fontSize={14} fontWeight="800" fill={DARK}>CI/CD PIPELINE — Code → Test → Deploy</text>

      {/* Simulate button */}
      <g onClick={simulate} style={{ cursor: 'pointer' }}>
        <rect x={430} y={350} width={240} height={35} rx={18} fill={running ? '#999' : BLUE} />
        <text x={550} y={372} textAnchor="middle" fontSize={12} fontWeight="700" fill="#fff">
          {running ? '⏳ Running pipeline...' : '▶ Simulate CI/CD Pipeline'}
        </text>
      </g>

      {/* Stages */}
      {stages.map((s, i) => {
        const active = step >= i + 1
        const current = step === i + 1
        return (
          <g key={i}>
            {/* Connection line */}
            {i > 0 && (
              <g>
                <line x1={stages[i-1].x + 100} y1={160} x2={s.x + 10} y2={160}
                  stroke={active ? '#10B981' : '#e0e0e0'} strokeWidth={active ? 3 : 2} />
                {active && (
                  <line x1={stages[i-1].x + 100} y1={160} x2={s.x + 10} y2={160}
                    stroke="#10B981" strokeWidth={4} strokeDasharray="6 10" opacity={0.5}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.5s" repeatCount="indefinite" />
                  </line>
                )}
              </g>
            )}
            {/* Node */}
            <g>
              {current && (
                <rect x={s.x - 5} y={95} width={120} height={130} rx={16} fill={s.color} opacity={0.1}>
                  <animate attributeName="opacity" values="0.1;0.2;0.1" dur="1s" repeatCount="indefinite" />
                </rect>
              )}
              <rect x={s.x} y={100} width={110} height={120} rx={14}
                fill={active ? '#fff' : '#fafafa'} stroke={active ? s.color : '#e0e0e0'}
                strokeWidth={current ? 3 : active ? 2 : 1} />
              <text x={s.x + 55} y={130} textAnchor="middle" fontSize={24}>{active ? '✅' : s.icon}</text>
              <text x={s.x + 55} y={155} textAnchor="middle" fontSize={10} fontWeight="700" fill={active ? s.color : '#999'}>{s.label}</text>
              {s.desc.split('\n').map((line, li) => (
                <text key={li} x={s.x + 55} y={170 + li * 12} textAnchor="middle" fontSize={7} fill="#999">{line}</text>
              ))}
            </g>
          </g>
        )
      })}

      {/* Progress bar */}
      <rect x={50} y={265} width={1000} height={6} rx={3} fill="#e0e0e0" />
      <rect x={50} y={265} width={Math.max(0, (step / stages.length) * 1000)} height={6} rx={3} fill="#10B981">
        <animate attributeName="opacity" values="1;0.7;1" dur="1s" repeatCount="indefinite" />
      </rect>
      <text x={550} y={290} textAnchor="middle" fontSize={9} fill="#999">
        {step === 0 ? 'Click to simulate' : step >= stages.length ? '✅ Pipeline complete — all stages passed' : `Stage ${step}/${stages.length} running...`}
      </text>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════
// VIEW 3: IaC BRAND ONBOARDING FLOW
// ═══════════════════════════════════════════════════════════
function IaCFlow() {
  const [step, setStep] = useState(0)
  const [brand, setBrand] = useState('explore')
  const brands = ['explore', 'santas-lapland', 'inntravel', 'kuoni', 'carrier']

  const stages = [
    { icon: '📋', label: 'Copy Template', desc: `cp terraform/brands/inghams\n→ terraform/brands/${brand}`, color: '#6B7280' },
    { icon: '🏗️', label: 'Terraform Plan', desc: `AWS: S3 + SQS + IAM\nSnowflake: schemas + WH`, color: '#7B42BC' },
    { icon: '☁️', label: 'AWS Created', desc: `dertour-${brand}-data-prod\nSnowpipe queue ready`, color: '#FF9900' },
    { icon: '❄️', label: 'Snowflake Created', desc: `${brand.toUpperCase()}_BRONZE\n${brand.toUpperCase()}_SILVER\n${brand.toUpperCase()}_GOLD`, color: '#29B5E8' },
    { icon: '⚙️', label: 'dbt Models', desc: `stg_${brand}_bookings\nfct_${brand}_bookings`, color: '#FF694A' },
    { icon: '🔄', label: 'Airflow DAG', desc: `dertour_${brand}_pipeline\nDeployed to MWAA`, color: '#8B5CF6' },
    { icon: '✅', label: 'LIVE', desc: `${brand} is now\nonboarded!`, color: '#10B981' },
  ]

  const simulate = () => {
    setStep(0)
    let s = 0
    const iv = setInterval(() => { s++; setStep(s); if (s >= stages.length) clearInterval(iv) }, 1000)
  }

  return (
    <svg viewBox="0 0 1100 500" className="w-full" style={{ minHeight: 350 }}>
      <defs>
        <linearGradient id="iacbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="100%" stopColor="#FFF7ED" />
        </linearGradient>
      </defs>
      <rect width="1100" height="500" fill="url(#iacbg)" rx="12" />
      <text x={550} y={30} textAnchor="middle" fontSize={14} fontWeight="800" fill={DARK}>IaC BRAND ONBOARDING — 15 Minutes Per Brand</text>

      {/* Brand selector */}
      {brands.map((b, i) => (
        <g key={b} onClick={() => { setBrand(b); setStep(0) }} style={{ cursor: 'pointer' }}>
          <rect x={150 + i * 170} y={50} width={150} height={28} rx={14}
            fill={brand === b ? BLUE : '#fff'} stroke={BLUE} strokeWidth={1.5} />
          <text x={225 + i * 170} y={68} textAnchor="middle" fontSize={9} fontWeight="600"
            fill={brand === b ? '#fff' : BLUE}>{b}</text>
        </g>
      ))}

      {/* Pipeline */}
      {stages.map((s, i) => {
        const x = 40 + i * 150
        const active = step >= i + 1
        const current = step === i + 1
        return (
          <g key={i}>
            {i > 0 && (
              <g>
                <line x1={x - 45} y1={175} x2={x + 5} y2={175} stroke={active ? '#10B981' : '#ddd'} strokeWidth={active ? 3 : 1.5} />
                {active && (
                  <line x1={x - 45} y1={175} x2={x + 5} y2={175} stroke="#10B981" strokeWidth={4} strokeDasharray="5 8" opacity={0.5}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-13" dur="0.4s" repeatCount="indefinite" />
                  </line>
                )}
              </g>
            )}
            <g>
              {current && (
                <rect x={x - 5} y={105} width={140} height={140} rx={14} fill={s.color} opacity={0.12}>
                  <animate attributeName="opacity" values="0.12;0.25;0.12" dur="0.8s" repeatCount="indefinite" />
                </rect>
              )}
              <rect x={x} y={110} width={130} height={130} rx={12}
                fill={active ? '#fff' : '#fafafa'} stroke={active ? s.color : '#e5e5e5'} strokeWidth={current ? 3 : active ? 2 : 1} />
              <text x={x + 65} y={145} textAnchor="middle" fontSize={22}>{active ? '✅' : s.icon}</text>
              <text x={x + 65} y={168} textAnchor="middle" fontSize={9} fontWeight="700" fill={active ? s.color : '#aaa'}>{s.label}</text>
              {s.desc.split('\n').map((line, li) => (
                <text key={li} x={x + 65} y={183 + li * 11} textAnchor="middle" fontSize={7} fill="#999">{line}</text>
              ))}
            </g>
          </g>
        )
      })}

      {/* Timer */}
      <text x={550} y={290} textAnchor="middle" fontSize={11} fontWeight="700" fill={step >= stages.length ? '#10B981' : '#999'}>
        {step === 0 ? `Ready to onboard: ${brand}` : step >= stages.length ? `✅ ${brand} is LIVE — total time: ~15 minutes` : `Provisioning ${brand}... step ${step}/${stages.length}`}
      </text>

      {/* Simulate button */}
      <g onClick={simulate} style={{ cursor: 'pointer' }}>
        <rect x={430} y={320} width={240} height={35} rx={18} fill={step > 0 && step < stages.length ? '#999' : '#7B42BC'} />
        <text x={550} y={342} textAnchor="middle" fontSize={12} fontWeight="700" fill="#fff">
          {step > 0 && step < stages.length ? '⏳ Provisioning...' : `▶ Onboard ${brand}`}
        </text>
      </g>

      {/* What gets created summary */}
      <g transform="translate(50, 380)">
        <text fontSize={9} fontWeight="700" fill={DARK}>Resources created for {brand}:</text>
        {[
          { label: `S3: dertour-${brand}-data-prod`, color: '#FF9900', done: step >= 3 },
          { label: `SF: ${brand.toUpperCase()}_BRONZE/SILVER/GOLD`, color: '#29B5E8', done: step >= 4 },
          { label: `dbt: stg/fct_${brand}_*`, color: '#FF694A', done: step >= 5 },
          { label: `DAG: dertour_${brand}_pipeline`, color: '#8B5CF6', done: step >= 6 },
        ].map((r, i) => (
          <text key={i} x={i * 260} y={20} fontSize={8} fill={r.done ? r.color : '#ccc'} fontWeight={r.done ? '700' : '400'}>
            {r.done ? '✅' : '○'} {r.label}
          </text>
        ))}
      </g>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Flows() {
  const [view, setView] = useState('data')
  const [selected, setSelected] = useState(null)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: DARK }}>Interactive Flows</h2>
          <p className="text-gray-400 text-sm">Animated pipeline visualisations — click simulate to see them run</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'data', label: '📊 Data Flow' },
            { id: 'cicd', label: '🚀 CI/CD' },
            { id: 'iac', label: '🏗️ IaC Onboard' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{ background: view === v.id ? DARK : 'transparent', color: view === v.id ? '#fff' : '#666' }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {view === 'data' && <DataFlow selected={selected} setSelected={setSelected} />}
        {view === 'cicd' && <CICDFlow />}
        {view === 'iac' && <IaCFlow />}
      </div>
    </div>
  )
}
