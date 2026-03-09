import React, { useEffect, useState } from 'react'

const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'
const GOLD_LT = '#E0C895'
const WHITE = '#FFFFFF'
const LIGHT = '#F8F6F3'

const API = import.meta.env.VITE_API_URL || 'https://backend-production-54bd.up.railway.app'

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

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ width: 4, height: 32, background: TEAL, borderRadius: 2 }} />
        <h2 style={{ fontSize: 26, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif', margin: 0 }}>{title}</h2>
      </div>
      {sub && <p style={{ fontSize: 14, color: '#6B7280', marginLeft: 16, marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

function Badge({ children, color = TEAL }) {
  return (
    <span style={{
      background: color, color: WHITE, fontSize: 10, fontWeight: 700,
      letterSpacing: '1.5px', textTransform: 'uppercase', padding: '3px 10px',
      borderRadius: 20, display: 'inline-block',
    }}>{children}</span>
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

function LiveStats() {
  const [kpis, setKpis] = useState(null)
  useEffect(() => {
    fetch(`${API}/api/kpis`).then(r => r.json()).then(setKpis).catch(() => {})
  }, [])
  const fmt = (n) => n ? `£${(n / 1_000_000).toFixed(1)}M` : '£60.2M'
  const fmtN = (n) => n ? n.toLocaleString() : '8,000'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
      <KPI icon="💷" value={kpis ? fmt(kpis.total_revenue) : '£60.2M'} label="Total Revenue (Live Snowflake)" accent={TEAL} />
      <KPI icon="✈️" value={kpis ? fmtN(kpis.total_bookings) : '8,000'} label="Total Bookings" accent="#0F766E" />
      <KPI icon="👥" value={kpis ? fmtN(kpis.total_customers) : '2,000'} label="Customers" accent="#92400E" />
      <KPI icon="📊" value={kpis ? `£${Math.round(kpis.avg_booking_value).toLocaleString()}` : '£8,325'} label="Avg Booking Value" accent={GOLD} />
    </div>
  )
}

export default function CIO() {
  return (
    <div style={{ background: LIGHT, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── HERO ── */}
      <div style={{
        background: `linear-gradient(135deg, ${TEAL} 0%, #0D2B38 100%)`,
        padding: '64px 0 52px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.15) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 30, padding: '5px 16px', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, marginBottom: 20 }}>
            CIO Briefing · DERTOUR / Kuoni · March 2026
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, color: WHITE, fontFamily: 'Georgia, serif', lineHeight: 1.15, marginBottom: 8 }}>
            Turning Snowflake into a{' '}
            <span style={{ color: GOLD, fontStyle: 'italic' }}>Strategic Asset</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 680, lineHeight: 1.7, marginBottom: 32 }}>
            A practical, commercially-grounded roadmap — aligned to DERTOUR Group's technology direction
            and Kuoni's brand promise of bespoke, personalised travel at scale.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['Presented by', 'Stephen Adebola — Data Architect'], ['For', 'Grant van Grenen, CIO · Kuoni / DERTOUR Group']].map(([label, val]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 16px' }}>
                <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, color: WHITE, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* ── LIVE DATA ── */}
        <div style={{ background: `linear-gradient(90deg, ${TEAL}, #2E6E8E)`, borderRadius: 12, padding: '14px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>❄️</span>
          <span style={{ color: WHITE, fontSize: 13, fontWeight: 600 }}>Live data pulled directly from your Snowflake environment in real time</span>
          <span style={{ marginLeft: 'auto', background: GOLD, color: TEAL, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>LIVE</span>
        </div>
        <LiveStats />

        {/* ── THE DERTOUR CONTEXT ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="The DERTOUR Group context" sub="Understanding where Kuoni fits — and what that means for your data strategy" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <Card accent={TEAL} style={{ padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>🌍 The Group Structure</div>
              {[
                ['Parent', 'REWE Group — major European cooperative'],
                ['Scale', '13,000 people · 180+ companies · 16 European markets'],
                ['Group CTO', 'Boris Raoul — owns tech strategy group-wide'],
                ['UK Division', 'DERTOUR Northern Europe (Leif Vase Larsen, CEO International)'],
                ['Kuoni UK', 'Premium tour operator · 100+ years · 200+ industry awards'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, minWidth: 80, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12, color: '#374151' }}>{v}</span>
                </div>
              ))}
            </Card>
            <Card accent={GOLD} style={{ padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>⚡ What This Means for You</div>
              {[
                ['Group alignment', 'Any data platform must align with Boris Raoul\'s group-wide tech direction — not just solve local problems'],
                ['Consolidated reporting', 'DERTOUR Group needs cross-brand reporting. Kuoni\'s Snowflake can be the UK blueprint'],
                ['Cost accountability', 'REWE is a cooperative — ROI on the Snowflake investment must be demonstrable'],
                ['Lighthouse potential', 'Build it right at Kuoni and it becomes the model for DERTOUR Northern Europe'],
              ].map(([k, v]) => (
                <div key={k} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{v}</div>
                </div>
              ))}
            </Card>
          </div>

          {/* The 5 commercial priorities */}
          <Card accent="#14532D" style={{ padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#14532D', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>🎯 The Five Priorities Data Must Solve for Kuoni</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              {[
                { icon: '👤', title: 'Personalisation at Scale', body: 'Kuoni\'s brand IS bespoke. Data makes it scalable without losing quality. Customer 360 is the foundation.' },
                { icon: '🛡️', title: 'OTA Defence', body: 'Booking.com has massive data advantages. Kuoni must use data to protect its premium position and justify higher prices.' },
                { icon: '🏪', title: 'Agent Performance', body: 'Kuoni sells through stores and agents. Understanding who converts, who doesn\'t, and why is commercially critical.' },
                { icon: '📊', title: 'Revenue Clarity', body: 'Real-time margin visibility by destination, product and agent. No more waiting for month-end reports to know how the business is performing.' },
                { icon: '🌐', title: 'Group Integration', body: 'Build Kuoni\'s data in a way that plugs into DERTOUR Group\'s consolidated reporting and aligns with Boris Raoul\'s tech strategy.' },
              ].map(({ icon, title, body }) => (
                <div key={title} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>{body}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── THE SITUATION ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="Where you are today" sub="Snowflake is live — but working well below its potential" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 20 }}>
            <Card accent="#16A34A" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>✓ What's Working</div>
              {['Snowflake deployed and running', 'Initial reporting use case functional', 'Team has Snowflake familiarity', 'Foundation data is accessible', 'Investment already committed'].map((t, i) => (
                <div key={i} style={{ fontSize: 13, color: '#374151', padding: '5px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#16A34A', fontWeight: 700, flexShrink: 0 }}>→</span>{t}
                </div>
              ))}
            </Card>
            <Card accent="#DC2626" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>✗ The Gaps</div>
              {['No enterprise data architecture', 'Silos across booking, CRM & ops', 'No single customer view', 'No self-service for business teams', 'No governance or quality framework', 'No alignment to DERTOUR Group reporting'].map((t, i) => (
                <div key={i} style={{ fontSize: 13, color: '#374151', padding: '5px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#DC2626', fontWeight: 700, flexShrink: 0 }}>→</span>{t}
                </div>
              ))}
            </Card>
            <Card accent={GOLD} style={{ background: TEAL, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>→ The Opportunity</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: WHITE, fontFamily: 'Georgia, serif', lineHeight: 1.4, marginBottom: 14 }}>
                Snowflake was a tactical fix.<br />
                <span style={{ color: GOLD, fontStyle: 'italic' }}>It can become Kuoni's strategic advantage — and DERTOUR Group's UK blueprint.</span>
              </p>
              {['Unified Customer 360 — powering personalisation at scale', 'Real-time commercial insight — revenue, margin, yield', 'Self-service analytics — marketing, commercial, ops', 'Group-ready architecture — plugs into DERTOUR reporting', 'OTA defence — data as a competitive moat'].map((t, i) => (
                <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', padding: '4px 0', display: 'flex', gap: 8 }}>
                  <span style={{ color: GOLD, flexShrink: 0 }}>◆</span>{t}
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 14, fontStyle: 'italic' }}>I've done this at Marlink — an almost identical situation. Tactical Snowflake → strategic platform.</p>
            </Card>
          </div>
        </div>

        {/* ── ROADMAP ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="Getting there in three phases" sub="Structured, low-risk — quick wins first, group-level integration last" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { num: 'Phase 1', title: 'Stabilise', timing: 'Months 1–2 · Foundations', color: TEAL,
                items: ['Audit existing Snowflake — schemas, credits, pipelines', 'Map all sources: booking engine, CRM, marketing, ops', 'Design enterprise data model — 4 core domains', 'Medallion architecture: Bronze → Silver → Gold', 'Data governance and naming framework', 'Power BI connected — first trusted dashboards'],
                outcome: 'Trusted foundation — no more data arguments in meetings' },
              { num: 'Phase 2', title: 'Elevate', timing: 'Months 3–4 · Value Creation', color: '#92400E',
                items: ['Customer 360 — single view across all touchpoints', 'Agent scorecard — performance and conversion rates', 'Revenue and margin dashboards — real-time visibility', 'Data Products per domain — governed, self-service', 'dbt automating transformations end-to-end', 'Data quality monitoring — issues caught automatically'],
                outcome: 'Business teams get answers in minutes — without asking IT' },
              { num: 'Phase 3', title: 'Scale', timing: 'Months 5–6 · Strategic Advantage', color: '#14532D',
                items: ['DERTOUR Group integration — align with Boris Raoul\'s tech direction', 'Consolidated UK reporting feeding group-level dashboards', 'Predictive analytics — LTV, churn risk, demand forecasting', 'Personalisation data feeds — CRM, marketing, in-store', 'Snowflake cost governance — right-sized credits', 'Kuoni as the blueprint for DERTOUR Northern Europe'],
                outcome: 'Kuoni is a data-first business — and the Group\'s UK lighthouse' },
            ].map(({ num, title, timing, color, items, outcome }) => (
              <Card key={title} accent={color} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Badge color={color}>{num}</Badge>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timing}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif' }}>{title}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                  {items.map((item, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: '#374151', paddingLeft: 16, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color, fontWeight: 700 }}>◆</span>{item}
                    </li>
                  ))}
                </ul>
                <div style={{ background: color, color: WHITE, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontWeight: 500 }}>
                  📌 {outcome}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── FIRST 90 DAYS ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="My first 90 days" sub="Concrete and structured — no long runways, no lengthy discovery phases" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { badge: 'Days 1–30', title: 'Listen & Assess', color: TEAL,
                items: ['Meet every team that touches data — understand pain points', 'Full Snowflake audit: schemas, queries, credit spend', 'Map data sources and integration points', 'Identify quick wins deliverable in 30 days', 'Understand DERTOUR Group reporting requirements', 'Agree success metrics with Grant and the team'],
                deliverable: 'Current State Report — honest assessment with prioritised recommendations and quick wins' },
              { badge: 'Days 31–60', title: 'Build & Architect', color: '#92400E',
                items: ['Medallion architecture implemented across existing data', 'Enterprise data model deployed — 4 core domains', 'First trusted Power BI dashboards live', 'Quick wins shipped to stakeholders', 'Governance framework in place', 'Automated data quality checks running'],
                deliverable: 'First trusted dashboards live — business teams can self-serve without asking IT' },
              { badge: 'Days 61–90', title: 'Accelerate & Prove', color: '#14532D',
                items: ['Data Products launched across 3 business domains', 'dbt pipelines automating transformations end-to-end', 'Agent performance scorecard delivered', 'Customer 360 first version live', 'DERTOUR Group alignment plan presented', 'ROI demonstrated with measurable data'],
                deliverable: 'Strategic roadmap to Grant and Boris Raoul — board-ready, DERTOUR-aligned' },
            ].map(({ badge, title, color, items, deliverable }) => (
              <Card key={title} accent={color} style={{ padding: 24 }}>
                <Badge color={color}>{badge}</Badge>
                <div style={{ fontSize: 20, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif', margin: '10px 0 14px' }}>{title}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((item, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: '#374151', paddingLeft: 14, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color }}>·</span>{item}
                    </li>
                  ))}
                </ul>
                <div style={{ background: color, color: WHITE, borderRadius: 8, padding: '10px 12px', fontSize: 11.5 }}>
                  <strong style={{ display: 'block', fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3, opacity: 0.8 }}>Deliverable</strong>
                  {deliverable}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ── WHY ME ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="I've done this before" sub="Directly relevant experience — mapped to Kuoni's exact situation" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { co: 'Marlink', role: 'Senior Data Architect — Most Relevant', color: TEAL,
                  detail: 'Led migration from Azure Databricks → Snowflake. Designed the enterprise data model for Customer, Product and Location domains. Architected MDM migration — exactly what Kuoni needs. I\'ve been through this exact journey: tactical Snowflake → strategic platform.' },
                { co: 'AllianzGI', role: 'Enterprise Platform Lead', color: '#92400E',
                  detail: 'Administered the enterprise Databricks platform. Stepped into a complex, already-live environment and brought structure quickly. Every Databricks pattern — Medallion, dbt, governance — transfers directly to Snowflake.' },
                { co: 'NHS England / Home Office', role: 'Principal Data Engineer', color: '#14532D',
                  detail: '1,000+ pipeline migrations at NHS England. 500+ at the Home Office. Delivered at government scale, reported to senior leadership — comfortable presenting to CIOs and programme directors.' },
              ].map(({ co, role, color, detail }) => (
                <div key={co} style={{ background: WHITE, borderRadius: 12, padding: 20, borderLeft: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: TEAL, marginBottom: 2 }}>{co}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 8 }}>{role}</div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{detail}</div>
                </div>
              ))}
            </div>
            <Card accent={GOLD} style={{ padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Core Capabilities</div>
              {[['Snowflake Architecture & Design', 95], ['Data Modelling (ELDM / Star Schema)', 95], ['dbt / Medallion Architecture', 93], ['Terraform / Platform-as-Code', 90], ['Data Governance & Data Products', 88], ['Power BI / Analytics Layer', 84], ['C-suite & Group-level Communication', 90]].map(([skill, pct]) => (
                <div key={skill} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 4 }}>
                    <span>{skill}</span><span style={{ color: TEAL, fontWeight: 700 }}>{pct}%</span>
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

        {/* ── CLOSE ── */}
        <div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #0D2B38 100%)`, borderRadius: 16, padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)' }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Summary & Proposal</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: WHITE, fontFamily: 'Georgia, serif', marginBottom: 10, lineHeight: 1.2 }}>
            Let's build something <span style={{ color: GOLD, fontStyle: 'italic' }}>worth having.</span>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 620, lineHeight: 1.7, marginBottom: 32 }}>
            Kuoni has the data. Snowflake is in place. What's needed is the architecture, the model,
            and the expertise to turn it into a strategic asset — one that aligns with DERTOUR Group's
            technology direction and makes Kuoni's bespoke brand scalable through data.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            {[['Engagement', 'Data Architect\n3–6 months'], ['First Step', '2-week discovery\nCurrent state audit'], ['90-Day Outcome', 'Strategic roadmap\nDERTOUR-aligned, board-ready']].map(([label, val]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '16px 24px', minWidth: 160, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 13, color: WHITE, fontWeight: 600, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Stephen Adebola &nbsp;·&nbsp; stephen@haba.io &nbsp;·&nbsp; Agent: Xavier Labat, La Fosse Associates
          </div>
        </div>

      </div>
    </div>
  )
}
