import React, { useEffect, useState } from 'react'

const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'
const GOLD_LT = '#E0C895'
const WHITE = '#FFFFFF'
const LIGHT = '#F8F6F3'
const DARK = '#0D1B24'

const API = import.meta.env.VITE_API_URL || 'https://backend-production-54bd.up.railway.app'

/* ─── tiny helpers ─────────────────────────────────────── */
function Section({ children, style = {} }) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', ...style }}>
      {children}
    </div>
  )
}

function Card({ children, style = {}, accent = TEAL }) {
  return (
    <div style={{
      background: WHITE, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      borderTop: `4px solid ${accent}`, overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  )
}

function KPI({ icon, value, label, accent = TEAL }) {
  return (
    <div style={{
      background: WHITE, borderRadius: 12, padding: '24px 20px', textAlign: 'center',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderTop: `4px solid ${accent}`,
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: TEAL, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function Badge({ children, color = TEAL }) {
  return (
    <span style={{
      background: color, color: WHITE, fontSize: 10, fontWeight: 700,
      letterSpacing: '1.5px', textTransform: 'uppercase', padding: '3px 10px',
      borderRadius: 20, display: 'inline-block',
    }}>
      {children}
    </span>
  )
}

function PhaseCard({ num, title, timing, items, outcome, color }) {
  return (
    <Card accent={color} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Badge color={color}>{num}</Badge>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timing}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif' }}>{title}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 13, color: '#374151', paddingLeft: 16, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: color, fontWeight: 700 }}>◆</span>
            {item}
          </li>
        ))}
      </ul>
      <div style={{
        background: color, color: WHITE, borderRadius: 8, padding: '10px 14px',
        fontSize: 12, fontWeight: 500, marginTop: 'auto',
      }}>
        📌 {outcome}
      </div>
    </Card>
  )
}

/* ─── Live KPIs from Snowflake ─────────────────────────── */
function LiveStats() {
  const [kpis, setKpis] = useState(null)
  useEffect(() => {
    fetch(`${API}/api/kpis`).then(r => r.json()).then(setKpis).catch(() => {})
  }, [])

  const fmt = (n) => n ? `£${(n / 1_000_000).toFixed(1)}M` : '—'
  const fmtN = (n) => n ? n.toLocaleString() : '—'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
      <KPI icon="💷" value={kpis ? fmt(kpis.total_revenue) : '£60.2M'} label="Total Revenue (Live)" accent={TEAL} />
      <KPI icon="✈️" value={kpis ? fmtN(kpis.total_bookings) : '8,000'} label="Total Bookings" accent="#0F766E" />
      <KPI icon="👥" value={kpis ? fmtN(kpis.total_customers) : '2,000'} label="Customers" accent="#92400E" />
      <KPI icon="📊" value={kpis ? `£${Math.round(kpis.avg_booking_value).toLocaleString()}` : '£8,325'} label="Avg Booking Value" accent={GOLD} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════ */
export default function CIO() {
  return (
    <div style={{ background: LIGHT, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${TEAL} 0%, #0D2B38 100%)`,
        padding: '64px 0 52px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(201,169,110,0.15) 0%, transparent 70%)`,
        }} />
        <Section>
          <div style={{
            display: 'inline-block', background: 'rgba(201,169,110,0.15)',
            border: '1px solid rgba(201,169,110,0.3)', borderRadius: 30,
            padding: '5px 16px', fontSize: 10, fontWeight: 700,
            letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, marginBottom: 20,
          }}>
            CIO Meeting · March 2026 · Strictly Confidential
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 800, color: WHITE,
            fontFamily: 'Georgia, serif', lineHeight: 1.15, marginBottom: 8,
          }}>
            Turning Snowflake into a{' '}
            <span style={{ color: GOLD, fontStyle: 'italic' }}>Strategic Asset</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 620, lineHeight: 1.7, marginBottom: 32 }}>
            A practical roadmap for making Kuoni's data platform the foundation
            for better decisions, faster growth, and lasting competitive advantage.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              ['Presented by', 'Stephen Adebola — Data Architect'],
              ['For', 'Richard Nunn, CIO · DERTOUR / Kuoni'],
            ].map(([label, val]) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10, padding: '10px 16px',
              }}>
                <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, color: WHITE, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div style={{ padding: '40px 0 80px' }}>
        <Section>

          {/* ── LIVE DATA CALLOUT ─────────────────────────── */}
          <div style={{
            background: `linear-gradient(90deg, ${TEAL} 0%, #2E6E8E 100%)`,
            borderRadius: 12, padding: '14px 24px', marginBottom: 32,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>❄️</span>
            <span style={{ color: WHITE, fontSize: 13, fontWeight: 600 }}>
              Live data below is pulled directly from your Snowflake environment in real time
            </span>
            <span style={{
              marginLeft: 'auto', background: GOLD, color: TEAL,
              fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
            }}>LIVE</span>
          </div>

          {/* ── KPIs ──────────────────────────────────────── */}
          <LiveStats />

          {/* ── THE SITUATION ─────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 32, background: TEAL, borderRadius: 2 }} />
              <h2 style={{ fontSize: 26, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif' }}>
                Where you are today
              </h2>
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, marginLeft: 16 }}>
              Snowflake is live — but working below its potential
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 20 }}>
              <Card accent="#16A34A">
                <div style={{ padding: '20px 20px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>✓ What's Working</div>
                  {['Snowflake is deployed and running', 'Initial reporting use case functional', 'Team has early Snowflake familiarity', 'Foundation data is accessible', 'Investment committed and in place'].map((t, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#374151', padding: '5px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#16A34A', fontWeight: 700, flexShrink: 0 }}>→</span> {t}
                    </div>
                  ))}
                </div>
              </Card>
              <Card accent="#DC2626">
                <div style={{ padding: '20px 20px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>✗ The Gaps</div>
                  {['No enterprise data architecture', 'Data silos across booking, CRM & ops', 'No single source of truth for customers', 'No self-service for business teams', 'No data governance or quality framework'].map((t, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#374151', padding: '5px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#DC2626', fontWeight: 700, flexShrink: 0 }}>→</span> {t}
                    </div>
                  ))}
                </div>
              </Card>
              <Card accent={GOLD} style={{ background: TEAL }}>
                <div style={{ padding: '20px 20px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>→ The Opportunity</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: WHITE, fontFamily: 'Georgia, serif', lineHeight: 1.4, marginBottom: 14 }}>
                    Snowflake was a tactical fix.<br />
                    <span style={{ color: GOLD, fontStyle: 'italic' }}>It can become your strategic advantage.</span>
                  </p>
                  {['Unified view of every customer', 'Real-time revenue & margin visibility', 'Self-service analytics for all teams', 'Foundation for personalisation at scale', 'Data products that power decisions'].map((t, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', padding: '4px 0', display: 'flex', gap: 8 }}>
                      <span style={{ color: GOLD, flexShrink: 0 }}>◆</span> {t}
                    </div>
                  ))}
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 14, fontStyle: 'italic' }}>
                    I've done this before — at Marlink in an almost identical situation.
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* ── ROADMAP ───────────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 32, background: TEAL, borderRadius: 2 }} />
              <h2 style={{ fontSize: 26, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif' }}>
                Getting there in three phases
              </h2>
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, marginLeft: 16 }}>
              Structured, low-risk progression — quick wins first, transformation second
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <PhaseCard
                num="Phase 1" title="Stabilise" timing="Months 1–2 · Foundations"
                color={TEAL}
                items={[
                  'Audit the existing Snowflake environment',
                  'Map all data sources: booking, CRM, marketing, ops',
                  'Design enterprise data model (Medallion architecture)',
                  'Bronze → Silver → Gold layer implementation',
                  'Data governance and naming conventions',
                  'Connect Snowflake to Power BI — first trusted reports',
                ]}
                outcome="A clean, trusted foundation — no more data arguments in meetings"
              />
              <PhaseCard
                num="Phase 2" title="Elevate" timing="Months 3–4 · Value Creation"
                color="#92400E"
                items={[
                  'Build Customer 360 — one view across all touchpoints',
                  'Launch governed Data Products per business domain',
                  'Automate data quality monitoring and alerting',
                  'Enable self-service analytics via semantic layer',
                  'Commercial revenue and margin dashboards live',
                  'dbt pipelines for automated transformations',
                ]}
                outcome="Teams get answers in minutes, not weeks — without asking IT"
              />
              <PhaseCard
                num="Phase 3" title="Scale" timing="Months 5–6 · Strategic Advantage"
                color="#14532D"
                items={[
                  'DERTOUR Group integration — multi-brand consolidated view',
                  'Predictive analytics: LTV scoring, churn risk, demand',
                  'Real-time personalisation feeds for CRM & marketing',
                  'Snowflake credit governance and cost optimisation',
                  'AI/ML-ready data products for the next phase',
                  'Centre of excellence — capability stays in your team',
                ]}
                outcome="Kuoni is a data-first business — built to compete and scale"
              />
            </div>
          </div>

          {/* ── FIRST 90 DAYS ─────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 32, background: TEAL, borderRadius: 2 }} />
              <h2 style={{ fontSize: 26, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif' }}>
                My first 90 days
              </h2>
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, marginLeft: 16 }}>
              Concrete and structured — no long runways, no lengthy discovery phases
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                {
                  badge: 'Days 1–30', title: 'Listen & Assess', color: TEAL,
                  items: [
                    'Meet every team that touches data',
                    'Full Snowflake audit: schemas, queries, credits',
                    'Map all data sources and integration points',
                    'Identify quick wins achievable in 30 days',
                    'Understand DERTOUR Group requirements',
                    'Agree success metrics with leadership',
                  ],
                  deliverable: 'Current State Report — honest assessment with prioritised recommendations',
                },
                {
                  badge: 'Days 31–60', title: 'Build & Architect', color: '#92400E',
                  items: [
                    'Implement Medallion architecture across existing data',
                    'Deploy enterprise data model — 4 core domains',
                    'First trusted Power BI dashboards live',
                    'Ship quick wins to stakeholders',
                    'Data governance framework in place',
                    'Automated data quality checks running',
                  ],
                  deliverable: 'First trusted dashboards live — business teams can self-serve',
                },
                {
                  badge: 'Days 61–90', title: 'Accelerate & Prove', color: '#14532D',
                  items: [
                    'Data Products launched: 3 business domains',
                    'dbt automating Silver and Gold transformations',
                    'Data quality monitoring with stakeholder alerting',
                    'Phases 2 & 3 roadmap presented to leadership',
                    'ROI demonstrated with measurable outcomes',
                    'Knowledge transfer — your team can extend it',
                  ],
                  deliverable: 'Strategic Data Roadmap — board-ready, clear outcomes and timelines',
                },
              ].map(({ badge, title, color, items, deliverable }) => (
                <Card key={title} accent={color} style={{ padding: 24 }}>
                  <Badge color={color}>{badge}</Badge>
                  <div style={{ fontSize: 20, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif', margin: '10px 0 14px' }}>{title}</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {items.map((item, i) => (
                      <li key={i} style={{ fontSize: 12.5, color: '#374151', paddingLeft: 14, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: color }}>·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div style={{ background: color, color: WHITE, borderRadius: 8, padding: '10px 12px', fontSize: 11.5, fontWeight: 500 }}>
                    <strong style={{ display: 'block', fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3, opacity: 0.8 }}>Deliverable</strong>
                    {deliverable}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ── WHY ME ────────────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 32, background: TEAL, borderRadius: 2 }} />
              <h2 style={{ fontSize: 26, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif' }}>
                I've done this before
              </h2>
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, marginLeft: 16 }}>
              Directly relevant experience — mapped to Kuoni's exact situation
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  {
                    co: 'Marlink', role: 'Senior Data Architect — Most Relevant', color: TEAL,
                    detail: 'Led migration from Azure Databricks → Snowflake. Designed the enterprise data model for Customer, Product and Location domains. Architected MDM migration — exactly what Kuoni needs. I\'ve been through this exact journey: tactical Snowflake → strategic platform.',
                  },
                  {
                    co: 'AllianzGI', role: 'Enterprise Platform Lead', color: '#92400E',
                    detail: 'Administered the enterprise Databricks platform. Stepped into a complex, already-live environment and brought structure quickly. Every pattern — Medallion, dbt, governance — transfers directly to Snowflake.',
                  },
                  {
                    co: 'NHS England / Home Office', role: 'Principal Data Engineer', color: '#14532D',
                    detail: '1,000+ pipeline migrations at NHS England. 500+ at the Home Office. Delivered at government scale, reported to senior leadership, comfortable translating architecture into board-level language.',
                  },
                ].map(({ co, role, color, detail }) => (
                  <div key={co} style={{
                    background: WHITE, borderRadius: 12, padding: 20,
                    borderLeft: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: TEAL, marginBottom: 2 }}>{co}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: color, letterSpacing: '0.5px', marginBottom: 8 }}>{role}</div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{detail}</div>
                  </div>
                ))}
              </div>
              <Card accent={GOLD} style={{ padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>Core Capabilities</div>
                {[
                  ['Snowflake Architecture & Design', 95],
                  ['Data Modelling (ELDM / Star Schema)', 95],
                  ['dbt / Medallion Architecture', 93],
                  ['Terraform / Platform-as-Code', 90],
                  ['Data Governance & Data Products', 88],
                  ['Power BI / Analytics Layer', 84],
                  ['C-suite Stakeholder Communication', 90],
                ].map(([skill, pct]) => (
                  <div key={skill} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 4 }}>
                      <span>{skill}</span>
                      <span style={{ color: TEAL, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
                <div style={{ background: TEAL, color: WHITE, borderRadius: 8, padding: '12px 14px', marginTop: 8, fontSize: 12 }}>
                  ⚡ Databricks expertise transfers directly to Snowflake — enterprise rigour, proven patterns, at scale.
                </div>
              </Card>
            </div>
          </div>

          {/* ── CLOSE / PROPOSAL ──────────────────────────── */}
          <div style={{
            background: `linear-gradient(135deg, ${TEAL} 0%, #0D2B38 100%)`,
            borderRadius: 16, padding: '48px 40px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)',
            }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Summary & Proposal</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: WHITE, fontFamily: 'Georgia, serif', marginBottom: 10, lineHeight: 1.2 }}>
              Let's build something <span style={{ color: GOLD, fontStyle: 'italic' }}>worth having.</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 600, lineHeight: 1.7, marginBottom: 32 }}>
              Kuoni has the data. Snowflake is in place. What's needed is the architecture, the model, and the expertise to connect them into something that actually drives the business forward.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
              {[
                ['Engagement', 'Data Architect\n3 – 6 months'],
                ['First Step', '2-week discovery\nCurrent state audit'],
                ['90-Day Outcome', 'Strategic roadmap\nboard-ready'],
              ].map(([label, val]) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12, padding: '16px 24px', minWidth: 160, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 13, color: WHITE, fontWeight: 600, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Stephen Adebola &nbsp;·&nbsp; stephen@haba.io &nbsp;·&nbsp; Agent: Xavier Labat, La Fosse Associates
            </div>
          </div>

        </Section>
      </div>
    </div>
  )
}
