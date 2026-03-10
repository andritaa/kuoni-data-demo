import React, { useState } from 'react'

const TEAL   = '#1B4F6B'
const GOLD   = '#C9A96E'
const GOLD_L = '#E0C895'
const LIGHT  = '#F8F6F3'

const sectionStyle = {
  fontFamily: "'Georgia', serif",
}

function Tag({ children, color = TEAL }) {
  return (
    <span style={{
      display: 'inline-block',
      background: color + '18',
      border: `1px solid ${color}40`,
      color,
      fontSize: 11,
      fontFamily: 'Calibri, sans-serif',
      fontWeight: 700,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      padding: '3px 10px',
      borderRadius: 20,
    }}>{children}</span>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 26, fontWeight: 700, color: TEAL, marginBottom: 6 }}>
        {children}
      </h2>
      <div style={{ width: 48, height: 3, background: GOLD, borderRadius: 2 }} />
    </div>
  )
}

function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {accent && <div style={{ height: 4, background: accent }} />}
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  )
}

function StatBox({ value, label, icon, color = TEAL }) {
  return (
    <div style={{
      background: color,
      borderRadius: 12,
      padding: '18px 20px',
      textAlign: 'center',
      color: '#fff',
    }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: "'Georgia', serif", fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: GOLD_L, marginTop: 5, letterSpacing: 0.5 }}>{label}</div>
    </div>
  )
}

function Phase({ num, title, timing, color, items, outcome }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ height: 5, background: color }} />
      <div style={{ padding: '20px 22px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color, marginBottom: 4 }}>{num}</div>
        <div style={{ fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700, color: TEAL, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>{timing}</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => (
            <li key={i} style={{ fontSize: 13, color: '#374151', paddingLeft: 16, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color, fontWeight: 700 }}>◆</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ background: color, padding: '12px 22px', fontSize: 12, color: '#fff', fontWeight: 500 }}>
        📌 {outcome}
      </div>
    </div>
  )
}

function ArchLayer({ icon, name, desc, color }) {
  return (
    <div style={{ background: color, borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  )
}

export default function CIOBrief() {
  const [activeTab, setActiveTab] = useState('situation')

  const tabs = [
    { id: 'situation', label: '01  The Situation' },
    { id: 'opportunity', label: '02  The Opportunity' },
    { id: 'roadmap', label: '03  Roadmap' },
    { id: 'plan', label: '04  First 90 Days' },
    { id: 'vision', label: '05  Architecture' },
    { id: 'whyme', label: '06  Why Me' },
  ]

  return (
    <div style={{ background: LIGHT, minHeight: '100vh', fontFamily: 'Calibri, sans-serif' }}>
      {/* Hero */}
      <div style={{ background: TEAL, padding: '52px 48px 44px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 320, height: 320,
          borderRadius: '50%', background: 'rgba(201,169,110,0.12)',
        }} />
        <Tag color={GOLD}>CIO Meeting · March 2026</Tag>
        <h1 style={{
          fontFamily: "'Georgia', serif", fontSize: 40, fontWeight: 700,
          color: '#fff', margin: '16px 0 8px', lineHeight: 1.2,
        }}>
          Turning Snowflake into a<br />
          <span style={{ color: GOLD, fontStyle: 'italic' }}>Strategic Asset</span>
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 580, lineHeight: 1.6, marginBottom: 28 }}>
          A practical roadmap for making Kuoni's data platform the foundation for better decisions, faster growth, and lasting competitive advantage.
        </p>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {[
            ['Presented by', 'Stephen Adebola — Data Architect'],
            ['For', 'Richard Nunn, CIO · Kuoni / DERTOUR Group'],
            ['Via', 'Xavier Labat · La Fosse Associates'],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '14px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? `3px solid ${GOLD}` : '3px solid transparent',
              fontSize: 12,
              fontWeight: 600,
              color: activeTab === t.id ? TEAL : '#6B7280',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* ── SITUATION ── */}
        {activeTab === 'situation' && (
          <div>
            <SectionTitle>Where you are today</SectionTitle>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>Snowflake is live — but working below its potential</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr', gap: 20 }}>
              <Card accent={TEAL}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: TEAL, textTransform: 'uppercase', marginBottom: 12 }}>✓  What's Working</div>
                {[
                  'Snowflake is deployed and running',
                  'Initial reporting use case is functional',
                  'Team has early Snowflake familiarity',
                  'Foundation data is accessible',
                  'Investment has been made and committed to',
                ].map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#374151', padding: '7px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
                    <span style={{ color: TEAL }}>→</span> {item}
                  </div>
                ))}
              </Card>
              <Card accent="#DC2626">
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#DC2626', textTransform: 'uppercase', marginBottom: 12 }}>✗  The Gaps</div>
                {[
                  'No enterprise data architecture around it',
                  'Data silos across booking, CRM & ops',
                  'No single source of truth for customers',
                  'No self-service for business teams',
                  'No data governance or quality framework',
                ].map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#374151', padding: '7px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#DC2626' }}>→</span> {item}
                  </div>
                ))}
              </Card>
              <div style={{ background: TEAL, borderRadius: 12, padding: '22px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 14 }}>→  The Opportunity</div>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 18, color: '#fff', lineHeight: 1.4, marginBottom: 6 }}>
                  Snowflake was a tactical fix.
                </div>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 18, color: GOLD, fontStyle: 'italic', lineHeight: 1.4, marginBottom: 20 }}>
                  It can become your strategic advantage.
                </div>
                {[
                  'Unified view of every customer, booking & destination',
                  'Real-time revenue and margin visibility',
                  'Self-service analytics for every team',
                  'Foundation for personalisation at scale',
                  'Data products that power commercial decisions',
                ].map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', padding: '5px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: GOLD }}>◆</span> {item}
                  </div>
                ))}
                <div style={{ marginTop: 18, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                  I've done this before — at Marlink in an almost identical situation.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── OPPORTUNITY ── */}
        {activeTab === 'opportunity' && (
          <div>
            <SectionTitle>What great looks like</SectionTitle>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>What a properly designed data platform enables for a premium travel brand</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              <StatBox value="360°" label="Customer View" icon="👤" color={TEAL} />
              <StatBox value="Real-time" label="Revenue Visibility" icon="⚡" color="#0F766E" />
              <StatBox value="Self-service" label="Analytics for All Teams" icon="📊" color="#92400E" />
              <StatBox value="Trusted" label="Single Source of Truth" icon="🎯" color="#1E3A5F" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { title: '✈️  Commercial Intelligence', color: TEAL, items: [
                  'Booking patterns by destination, agent & season',
                  'Revenue and margin per product line',
                  'Cancellation and amendment trends',
                  'Channel performance (online vs agent)',
                  'Yield management and pricing insight',
                ]},
                { title: '👥  Customer Intelligence', color: '#92400E', items: [
                  'Lifetime value and loyalty segmentation',
                  'Repeat booking likelihood modelling',
                  'Personalisation signals across touchpoints',
                  'Churn risk identification before it happens',
                  'Customer 360 across all systems',
                ]},
                { title: '🏢  Operational Intelligence', color: '#14532D', items: [
                  'Supplier and destination performance',
                  'Agent productivity and conversion rates',
                  'Capacity utilisation and yield management',
                  'DERTOUR Group consolidated reporting',
                  'Real-time operational dashboards',
                ]},
              ].map((cap, i) => (
                <Card key={i} accent={cap.color}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: cap.color, marginBottom: 14 }}>{cap.title}</div>
                  {cap.items.map((item, j) => (
                    <div key={j} style={{ fontSize: 13, color: '#374151', padding: '6px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
                      <span style={{ color: cap.color, flexShrink: 0 }}>→</span> {item}
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── ROADMAP ── */}
        {activeTab === 'roadmap' && (
          <div>
            <SectionTitle>Getting there in three phases</SectionTitle>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>Structured, low-risk progression — quick wins first, transformation second</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              <Phase
                num="Phase 1" title="Stabilise" timing="Months 1–2  ·  Foundations" color={TEAL}
                items={[
                  'Audit the existing Snowflake environment',
                  'Map all data sources: booking, CRM, marketing, ops',
                  'Design the enterprise data model',
                  'Implement Bronze → Silver → Gold (Medallion)',
                  'Establish data governance and naming conventions',
                  'Connect Snowflake to Power BI — first trusted reports',
                ]}
                outcome="A clean, trusted foundation — no more data arguments in meetings"
              />
              <Phase
                num="Phase 2" title="Elevate" timing="Months 3–4  ·  Value Creation" color={GOLD}
                items={[
                  'Build Customer 360 — unified profile across all touchpoints',
                  'Launch governed Data Products per business domain',
                  'Automate data quality monitoring and alerting',
                  'Enable self-service analytics via semantic layer',
                  'Commercial revenue and margin dashboards live',
                  'Integrate dbt for automated transformation pipelines',
                ]}
                outcome="Teams get answers in minutes, not weeks — without asking IT"
              />
              <Phase
                num="Phase 3" title="Scale" timing="Months 5–6  ·  Strategic Advantage" color="#16A34A"
                items={[
                  'DERTOUR Group integration — multi-brand consolidated view',
                  'Predictive analytics: LTV scoring, churn risk, demand',
                  'Real-time personalisation feeds for CRM & marketing',
                  'Snowflake credit governance and cost optimisation',
                  'AI/ML-ready data products for the next phase',
                  'Centre of excellence — capability transferred to your team',
                ]}
                outcome="Kuoni is now a data-first business — built to compete and scale"
              />
            </div>
          </div>
        )}

        {/* ── FIRST 90 DAYS ── */}
        {activeTab === 'plan' && (
          <div>
            <SectionTitle>My first 90 days</SectionTitle>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>A concrete, structured start — no long runways, no lengthy discovery phases</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { badge: 'Days 1–30', title: 'Listen & Assess', color: TEAL, items: [
                  'Meet every team that touches data — what do they need?',
                  'Full audit of Snowflake: schemas, queries, credit consumption',
                  'Map all data sources and integration points',
                  'Identify quick wins: what can we improve in 30 days?',
                  'Understand DERTOUR Group reporting requirements',
                  'Agree success metrics with Richard and the team',
                ], deliverable: 'Current State Report — honest assessment with prioritised recommendations' },
                { badge: 'Days 31–60', title: 'Build & Architect', color: GOLD, items: [
                  'Implement Medallion architecture across existing data',
                  'Deploy enterprise data model — Customer, Booking, Destination, Agent',
                  'First trusted Power BI dashboards live',
                  'Ship quick wins from Month 1 to stakeholders',
                  'Data governance framework: ownership, naming, documentation',
                  'Data quality checks automated — issues caught before they hit reports',
                ], deliverable: 'First trusted dashboards live — business teams can self-serve' },
                { badge: 'Days 61–90', title: 'Accelerate & Prove', color: '#16A34A', items: [
                  'Data Products launched: Commercial, Customer, Operations',
                  'dbt pipelines automating Silver and Gold layer transformations',
                  'Data quality monitoring in place with stakeholder alerting',
                  'Strategic roadmap for Phases 2 & 3 presented to leadership',
                  'Business case for continued investment — ROI demonstrated',
                  'Knowledge transfer — your team can maintain and extend the platform',
                ], deliverable: 'Strategic Data Roadmap — board-ready, with clear outcomes and timelines' },
              ].map((p, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ height: 4, background: p.color }} />
                  <div style={{ padding: '20px 22px', flex: 1 }}>
                    <span style={{ display: 'inline-block', background: p.color, color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', padding: '3px 12px', borderRadius: 20, marginBottom: 12 }}>{p.badge}</span>
                    <div style={{ fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700, color: TEAL, marginBottom: 16 }}>{p.title}</div>
                    {p.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 13, color: '#374151', padding: '6px 0', borderBottom: '1px solid #F9FAFB', display: 'flex', gap: 8 }}>
                        <span style={{ color: p.color, flexShrink: 0 }}>·</span> {item}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: p.color, padding: '12px 22px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 4 }}>Deliverable</div>
                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{p.deliverable}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ARCHITECTURE ── */}
        {activeTab === 'vision' && (
          <div>
            <SectionTitle>The target architecture</SectionTitle>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>Where Snowflake sits in a modern, integrated data platform for Kuoni</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 14 }}>Data Platform Layers</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <ArchLayer icon="📥" name="Source Systems" desc="Booking engine · CRM · Marketing · Finance · Agents" color={TEAL} />
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#D1D5DB' }}>↓ ingest</div>
                  <ArchLayer icon="🥉" name="Bronze Layer" desc="Raw ingestion — full history, immutable, schema-on-read" color="#A16207" />
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#D1D5DB' }}>↓ cleanse</div>
                  <ArchLayer icon="🥈" name="Silver Layer" desc="Cleansed, standardised, deduplicated, validated" color="#4B5563" />
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#D1D5DB' }}>↓ model</div>
                  <ArchLayer icon="🥇" name="Gold Layer" desc="Business-ready views · Data Products · KPIs · Aggregates" color="#92400E" />
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#D1D5DB' }}>↓ serve</div>
                  <ArchLayer icon="📊" name="Consumption Layer" desc="Power BI · Self-service Analytics · APIs · AI/ML ready" color="#14532D" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { title: 'Governance at every layer', color: TEAL, items: [
                    'Data ownership defined per domain',
                    'Automated quality checks before Gold promotion',
                    'Full lineage — know where every number comes from',
                    'Role-based access — right data to right people',
                    'GDPR / compliance controls built in',
                  ]},
                  { title: 'Self-service for the business', color: GOLD, items: [
                    'Marketing can answer their own questions',
                    'Commercial builds their own reports without IT',
                    'Operations gets real-time operational views',
                    'IT focuses on architecture, not ad-hoc queries',
                  ]},
                  { title: '🔌 DERTOUR Group Integration', color: '#16A34A', items: [
                    "Kuoni's platform becomes the model for the group",
                    'Consolidated reporting across all DERTOUR brands',
                    'One architecture, scaled across the portfolio',
                  ]},
                ].map((block, i) => (
                  <Card key={i} accent={block.color}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: block.color, marginBottom: 10 }}>{block.title}</div>
                    {block.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 13, color: '#374151', padding: '5px 0', borderBottom: '1px solid #F9FAFB', display: 'flex', gap: 8 }}>
                        <span style={{ color: block.color, flexShrink: 0 }}>◆</span> {item}
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── WHY ME ── */}
        {activeTab === 'whyme' && (
          <div>
            <SectionTitle>I've done this before</SectionTitle>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>Directly relevant experience — mapped to Kuoni's exact situation</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { co: 'Marlink', role: 'Senior Data Architect  (Most Relevant)', color: TEAL,
                    detail: "Led migration from Azure Databricks → Snowflake. Designed the enterprise data model for Customer, Product and Location domains. Architected MDM migration — exactly what Kuoni needs for its customer data. I've been through this exact journey: tactical Snowflake → strategic platform." },
                  { co: 'AllianzGI', role: 'Enterprise Platform Lead', color: GOLD,
                    detail: "Administered the enterprise Databricks platform. Stepped into a complex, already-live environment and brought order quickly. Every pattern transfers to Snowflake: Medallion, dbt, governance, Unity Catalog ≈ Snowflake Horizon." },
                  { co: 'NHS England / Home Office', role: 'Principal Data Engineer', color: '#16A34A',
                    detail: '1,000+ pipeline migrations at NHS England. 500+ at the Home Office. Reported to senior leadership and delivered at government scale — comfortable translating architecture into board-level language.' },
                ].map((exp, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderLeft: `4px solid ${exp.color}`, borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEAL, marginBottom: 3 }}>{exp.co}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: exp.color, letterSpacing: 0.5, marginBottom: 8 }}>{exp.role}</div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{exp.detail}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card accent={GOLD}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, marginBottom: 14 }}>Core Capabilities</div>
                  {[
                    ['Snowflake Architecture & Design', 95],
                    ['Data Modelling (ELDM / Star Schema)', 95],
                    ['dbt / Medallion Architecture', 92],
                    ['Terraform / Platform-as-Code', 90],
                    ['Data Governance & Data Products', 88],
                    ['Power BI / Analytics Layer', 83],
                    ['C-suite Stakeholder Communication', 88],
                  ].map(([skill, pct]) => (
                    <div key={skill} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 4 }}>
                        <span>{skill}</span><span style={{ color: '#9CA3AF' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </Card>
                <div style={{ background: TEAL, borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }}>⚡ Databricks → Snowflake</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                    Every pattern mastered on Databricks transfers directly: Medallion architecture, dbt transformations, Unity Catalog ≈ Snowflake Horizon, Delta Lake ≈ Iceberg. Enterprise Databricks rigour, applied to your Snowflake investment.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{
          marginTop: 56, background: TEAL, borderRadius: 16, padding: '36px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
        }}>
          <div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 24, color: '#fff', fontWeight: 700, marginBottom: 6 }}>
              Let's build something <span style={{ color: GOLD, fontStyle: 'italic' }}>worth having.</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Stephen Adebola · stephen@haba.io · Via Xavier Labat, La Fosse</div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[['Engagement', 'Data Architect · 3–6 months'], ['First Step', '2-week discovery audit'], ['90-Day Output', 'Board-ready roadmap']].map(([label, val]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '12px 18px', textAlign: 'center', minWidth: 140 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
