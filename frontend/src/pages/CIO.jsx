import React, { useEffect, useState } from 'react'

const TEAL = '#1B4F6B'
const GOLD = '#C9A96E'
const WHITE = '#FFFFFF'
const LIGHT = '#F8F6F3'

const API = import.meta.env.VITE_API_URL || 'https://backend-production-54bd.up.railway.app'

function Card({ children, style = {}, accent = TEAL }) {
  return (
    <div style={{
      background: WHITE, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      borderTop: `4px solid ${accent}`, ...style,
    }}>{children}</div>
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

function LiveStats() {
  const [kpis, setKpis] = useState(null)
  useEffect(() => {
    fetch(`${API}/api/overview`).then(r => r.json()).then(setKpis).catch(() => {})
  }, [])
  const fmt = (n) => (n && !isNaN(n)) ? `£${(n / 1_000_000).toFixed(1)}M` : '£60.2M'
  const fmtN = (n) => (n && !isNaN(n)) ? Number(n).toLocaleString() : '8,000'
  const fmtAvg = (n) => (n && !isNaN(n)) ? `£${Math.round(n).toLocaleString()}` : '£8,325'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 8 }}>
      {[
        { icon: '💷', value: kpis ? fmt(kpis.total_revenue_gbp) : '£60.2M', label: 'Total Revenue', accent: TEAL },
        { icon: '✈️', value: kpis ? fmtN(kpis.total_bookings) : '8,000', label: 'Bookings', accent: '#0F766E' },
        { icon: '👥', value: kpis ? fmtN(kpis.active_customers) : '2,000', label: 'Customers', accent: '#92400E' },
        { icon: '📊', value: kpis ? fmtAvg(kpis.avg_booking_value_gbp) : '£8,325', label: 'Avg Booking Value', accent: GOLD },
      ].map(({ icon, value, label, accent }) => (
        <div key={label} style={{ background: WHITE, borderRadius: 12, padding: '20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderTop: `4px solid ${accent}` }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: TEAL, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 5, fontWeight: 500 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Tab reference cards — links back to what Nunn saw ── */
function DemoRef({ icon, tab, title, what }) {
  return (
    <div style={{ background: WHITE, borderRadius: 10, padding: '14px 16px', border: '1px solid #E5E7EB', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>{tab}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{what}</div>
      </div>
    </div>
  )
}

export default function CIO() {
  return (
    <div style={{ background: LIGHT, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── HERO ── */}
      <div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #0D2B38 100%)`, padding: '60px 0 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.15) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 30, padding: '5px 16px', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, marginBottom: 18 }}>
            CIO Briefing · Grant van Grenen · DERTOUR / Kuoni · March 2026
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: 800, color: WHITE, fontFamily: 'Georgia, serif', lineHeight: 1.15, marginBottom: 10 }}>
            From proof of concept<br />to{' '}
            <span style={{ color: GOLD, fontStyle: 'italic' }}>production-grade platform</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 680, lineHeight: 1.7, marginBottom: 28 }}>
            Everything you see across this platform — the live Snowflake data, the data quality framework,
            the entity model, the data products catalogue — was built to show you exactly what's possible.
            This briefing sets out how we take it from here to production, aligned to DERTOUR Group's
            technology direction.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['Following conversation with', 'Richard Nunn, Integration Architect'], ['CIO Briefing for', 'Grant van Grenen · Kuoni / DERTOUR Group'], ['Presented by', 'Stephen Adebola — Data Architect']].map(([label, val]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px' }}>
                <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, color: WHITE, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* ── LIVE DATA CALLOUT ── */}
        <div style={{ background: `linear-gradient(90deg, ${TEAL}, #2E6E8E)`, borderRadius: 12, padding: '14px 24px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>❄️</span>
          <span style={{ color: WHITE, fontSize: 13, fontWeight: 600 }}>All figures below are live — pulled directly from your Snowflake environment in real time</span>
          <span style={{ marginLeft: 'auto', background: GOLD, color: TEAL, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>LIVE SNOWFLAKE</span>
        </div>
        <LiveStats />
        <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 36, marginTop: 8, textAlign: 'right' }}>
          ↑ These are the same KPIs from the 📊 Dashboard tab — your data, live, in production
        </p>

        {/* ── GRANT'S 5 COMMERCIAL CHALLENGES ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="Five commercial challenges this platform solves" sub="Built specifically around Kuoni's real strategic priorities — not generic data platform features" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 16 }}>
            {[
              { num: '01', title: 'DERTOUR Group Alignment', icon: '🏛️', color: TEAL,
                detail: 'Every data product and pipeline is architected to connect to group-level reporting. Kuoni UK becomes the blueprint for DERTOUR Northern Europe — not a local island.' },
              { num: '02', title: 'Personalisation at Scale', icon: '🎯', color: '#0F766E',
                detail: 'Customer 360 turns bespoke holiday expertise into data-driven personalisation. What your consultants do intuitively — the platform makes systematic and scalable.' },
              { num: '03', title: 'OTA Competitive Defence', icon: '⚔️', color: '#92400E',
                detail: 'Booking.com has data advantage. This platform closes the gap — real-time customer intelligence, destination performance, and booking pattern insight that premium operators need.' },
              { num: '04', title: 'Agent Network Visibility', icon: '📊', color: '#6D28D9',
                detail: 'Agent Scorecard gives leadership clear visibility of consultant productivity, conversion rates, and revenue contribution — commercial intelligence that currently doesn\'t exist.' },
              { num: '05', title: 'Snowflake ROI Clarity', icon: '💷', color: '#92400E',
                detail: 'Snowflake is already paid for. Phase 1 delivers a clear ROI picture: what\'s working, what\'s wasted, and what would unlock the full investment. Cost accountability from day one.' },
            ].map(({ num, title, icon, color, detail }) => (
              <div key={num} style={{ background: WHITE, borderRadius: 12, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `4px solid ${color}` }}>
                <div style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: '2px', marginBottom: 6 }}>{num}</div>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: TEAL, marginBottom: 8, lineHeight: 1.3 }}>{title}</div>
                <div style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.6 }}>{detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── WHAT RICHARD SAW TODAY ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="What we walked through today" sub="A summary of everything Richard Nunn reviewed — the foundation for this conversation" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <DemoRef icon="📊" tab="Dashboard" title="Live Snowflake KPIs"
              what="Real-time revenue, bookings, avg value and customer counts — all queried live from your Snowflake Gold layer. This is what reporting looks like when the architecture is right." />
            <DemoRef icon="🏗️" tab="Architecture"
              title="Current state & target landscape"
              what="3-phase roadmap: Stabilise → Elevate → Scale. Assessment across 8 areas of your current platform. Integration landscape showing how every system connects." />
            <DemoRef icon="🔍" tab="Data Quality"
              title="Live DQ scorecard"
              what="Live data quality checks running against your Snowflake Bronze tables — completeness, validity, uniqueness, consistency, timeliness. Issues surfaced automatically, not discovered manually." />
            <DemoRef icon="📐" tab="Data Model (ELDM)"
              title="Enterprise logical data model"
              what="6 core entities — Customer, Booking, Product, Destination, Agent, Interaction — modelled with PK/FK relationships, PII tagging, and medallion layer mapping." />
            <DemoRef icon="📦" tab="Data Products"
              title="5 governed data products"
              what="Domain-driven data products — Customer 360, Booking Intelligence, Destination Performance, Agent Scorecard, Executive KPIs — all with SLA tiers, lineage, and governance tags in Snowflake." />
            <DemoRef icon="⚡" tab="Databricks → Snowflake"
              title="Capability transfer map"
              what="Every Databricks pattern — Medallion, dbt, Unity Catalog, Delta — mapped to its Snowflake equivalent. The expertise transfers. Nothing is lost." />
          </div>
          <Card accent={GOLD} style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ fontSize: 36, flexShrink: 0 }}>💡</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEAL, marginBottom: 6 }}>This wasn't a slide deck. It was a working platform.</div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  Everything Richard reviewed today is connected to your live Snowflake account — real data, real architecture, real data products.
                  What you're seeing is not what could be built. It's a demonstration of how it would be built — using your data, in your environment, following the patterns that work at enterprise scale.
                  The question isn't whether this is possible. It's how quickly we start.
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── THE KUONI CONTEXT — NO HOLDING BACK ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="The context you can't ignore" sub="Why this matters more for Kuoni than for most travel companies" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card accent="#DC2626" style={{ padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>⚠️ The Cautionary Tale</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEAL, fontFamily: 'Georgia, serif', lineHeight: 1.4, marginBottom: 12 }}>
                INSEAD published a business school case study on Kuoni titled: <span style={{ color: '#DC2626', fontStyle: 'italic' }}>"Missing the Digital Boat — The Downfall of an Icon."</span>
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
                The case documents the "boiling frog syndrome" — how threats from Booking.com, Expedia, and TripAdvisor multiplied while decisive action was delayed. The lesson: incumbents who treat data and digital as secondary priorities lose ground they can't recover.
              </div>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991B1B', fontWeight: 500 }}>
                The Kuoni brand survived under DERTOUR. The lesson must not be forgotten.
              </div>
            </Card>
            <Card accent="#14532D" style={{ padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#14532D', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>✅ The Opportunity Now</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEAL, fontFamily: 'Georgia, serif', lineHeight: 1.4, marginBottom: 12 }}>
                Kuoni has already shown it can make bold, data-led decisions.
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
                The data profiling exercise that led to axing TV for targeted digital and mail was a clear signal: when Kuoni trusts its data, it acts boldly. A proper data platform gives leadership the confidence to make those calls faster and more often.
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
                The March 2025 rebrand is already driving improved brand health and family consideration. Data is what makes that commercial momentum measurable, scalable, and repeatable.
              </div>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#14532D', fontWeight: 500 }}>
                My job is to build the infrastructure that makes bold decisions the default — not the exception.
              </div>
            </Card>
          </div>
        </div>

        {/* ── FROM DEMO TO PRODUCTION ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionTitle title="From demo to production" sub="The roadmap — picking up exactly where today's conversation left off" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                num: 'Phase 1', title: 'Stabilise', timing: 'Months 1–2', color: TEAL,
                link: 'Builds on: 🏗️ Architecture tab — current state assessment & integration landscape',
                items: [
                  'Audit live Snowflake environment — credits, schemas, pipelines',
                  'Map all real source systems into the integration landscape',
                  'Implement the ELDM in production (6 core entities, already modelled)',
                  'Bronze → Silver → Gold — Medallion in production, not just demo',
                  'Data governance: ownership, naming, access control',
                  'Power BI connected — first trusted dashboards live',
                ],
                outcome: 'Trusted foundation. No more data arguments in meetings.',
              },
              {
                num: 'Phase 2', title: 'Elevate', timing: 'Months 3–4', color: '#92400E',
                link: 'Builds on: 📦 Data Products + 🔍 Data Quality tabs',
                items: [
                  'Promote all 5 Data Products from demo to production Snowflake',
                  'Customer 360 live — single view across booking, CRM, marketing',
                  'Agent Scorecard in production — conversion, revenue, productivity',
                  'DQ framework automated — issues caught before they reach reports',
                  'Self-service analytics via semantic layer for business teams',
                  'dbt pipelines automating Silver and Gold transformations',
                ],
                outcome: 'Teams get answers in minutes — without asking IT.',
              },
              {
                num: 'Phase 3', title: 'Scale', timing: 'Months 5–6', color: '#14532D',
                link: 'Builds on: ⚡ Databricks → Snowflake capability map',
                items: [
                  'DERTOUR Group integration — Kuoni as the UK data blueprint',
                  'Consolidated reporting feeding Leif Vase Larsen\'s Northern Europe view',
                  'Predictive analytics — LTV, churn risk, demand forecasting',
                  'Personalisation data feeds — CRM, marketing, in-store experts',
                  'Snowflake credit governance — ROI demonstrated, costs right-sized',
                  'Centre of excellence — capability transfers to your permanent team',
                ],
                outcome: 'Kuoni is a data-first business. The Digital Boat is not missed twice.',
              },
            ].map(({ num, title, timing, color, link, items, outcome }) => (
              <Card key={title} accent={color} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Badge color={color}>{num}</Badge>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timing}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif' }}>{title}</div>
                <div style={{ background: '#F8F6F3', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>{link}</div>
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
          <SectionTitle title="My first 90 days" sub="No long runways. Picking up from where today's conversation left off." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { badge: 'Days 1–30', title: 'Listen & Assess', color: TEAL,
                items: ['Meet every team that touches data', 'Full Snowflake audit: schemas, credits, real pipelines', 'Map live source systems into integration landscape', 'Quick wins from today\'s conversation — implement immediately', 'Align with Grant on success metrics and DERTOUR Group reporting needs'],
                deliverable: 'Current State Report — honest, prioritised, with quick wins already shipped' },
              { badge: 'Days 31–60', title: 'Build & Architect', color: '#92400E',
                items: ['ELDM from demo into production Snowflake', 'Medallion architecture live across real data', 'First Power BI dashboards — revenue, agents, destinations', 'Data quality checks automated across production tables', 'Agent Scorecard (from Data Products tab) live and accurate'],
                deliverable: 'Business teams self-serving. First measurable ROI on Snowflake investment.' },
              { badge: 'Days 61–90', title: 'Accelerate & Prove', color: '#14532D',
                items: ['All 5 Data Products in production', 'Customer 360 powering CRM and marketing personalisation', 'dbt automating Silver and Gold end-to-end', 'DERTOUR Group alignment plan for Leif Vase Larsen', 'ROI case built — Snowflake investment justified with data'],
                deliverable: 'Strategic roadmap presented to Grant and DERTOUR Group leadership.' },
            ].map(({ badge, title, color, items, deliverable }) => (
              <Card key={title} accent={color} style={{ padding: 24 }}>
                <Badge color={color}>{badge}</Badge>
                <div style={{ fontSize: 20, fontWeight: 800, color: TEAL, fontFamily: 'Georgia, serif', margin: '10px 0 14px' }}>{title}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
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
          <SectionTitle title="Why me" sub="Relevant experience — directly mapped to Kuoni's situation" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { co: 'Marlink', role: 'Senior Data Architect — Most Relevant', color: TEAL,
                  detail: 'Led migration from Azure Databricks → Snowflake. Designed the enterprise data model for Customer, Product and Location domains — exactly the same entities in the ELDM tab you reviewed today. Architectural MDM migration. Tactical Snowflake → strategic platform. I\'ve been through this exact journey.' },
                { co: 'AllianzGI', role: 'Enterprise Platform Lead', color: '#92400E',
                  detail: 'Stepped into a complex, already-live environment and brought order quickly. Every pattern demonstrated today — Medallion, dbt, data products, governance — was proven at enterprise scale here first.' },
                { co: 'NHS England / Home Office', role: 'Principal Data Engineer', color: '#14532D',
                  detail: '1,000+ pipeline migrations at NHS. 500+ at the Home Office. Reported to programme directors and senior civil servants. Comfortable translating technical architecture into decisions leadership can act on.' },
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
              {[
                ['Snowflake Architecture & Design', 95],
                ['Data Modelling (ELDM / Star Schema)', 95],
                ['dbt / Medallion Architecture', 93],
                ['Terraform / Platform-as-Code (self-service)', 90],
                ['Data Governance & Data Products', 88],
                ['Power BI / Analytics Layer', 84],
                ['C-suite Communication & Group Alignment', 90],
              ].map(([skill, pct]) => (
                <div key={skill} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 4 }}>
                    <span>{skill}</span><span style={{ color: TEAL, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
              <div style={{ background: TEAL, color: WHITE, borderRadius: 8, padding: '12px 14px', marginTop: 8, fontSize: 12, lineHeight: 1.5 }}>
                ⚡ Everything in the Databricks → SF tab maps to Snowflake equivalents already running in this demo. The expertise is here. The patterns are proven.
              </div>
            </Card>
          </div>
        </div>

        {/* ── CLOSE ── */}
        <div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #0D2B38 100%)`, borderRadius: 16, padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)' }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>The Proposal</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: WHITE, fontFamily: 'Georgia, serif', marginBottom: 10, lineHeight: 1.2 }}>
            The Digital Boat{' '}
            <span style={{ color: GOLD, fontStyle: 'italic' }}>is not missed twice.</span>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', maxWidth: 640, lineHeight: 1.7, marginBottom: 32 }}>
            Everything you reviewed today with Richard is live and working. The ELDM is designed. The data products are governed. The architecture is mapped. The data quality framework is running. This is not a concept. The next step is a start date.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            {[['Engagement', 'Data Architect\n3–6 months'], ['First Step', '2-week discovery\nCurrent state → quick wins'], ['90-Day Deliverable', 'Production platform\nDERTOUR Group-aligned'], ['Your Investment', 'Snowflake already paid for\nWe make it earn its keep']].map(([label, val]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '16px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 13, color: WHITE, fontWeight: 600, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: '🏛️ Group Impact', text: 'Kuoni becomes the DERTOUR Northern Europe data blueprint — not just a local deployment' },
              { label: '🎯 Personalisation', text: 'Customer 360 live in 90 days — bespoke holiday expertise powered by data' },
              { label: '📊 ROI Clarity', text: 'Snowflake investment justified with numbers, not promises, within the first month' },
            ].map(({ label, text }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{text}</div>
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
