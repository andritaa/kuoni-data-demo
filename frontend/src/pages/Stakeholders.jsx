import React, { useState } from 'react'

const BLUE = '#003366'
const GOLD = '#C9A96E'

const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' }

const stakeholders = [
  { name: 'Grant van Grenen', role: 'CEO, DERTOUR UK / Northern Europe', org: 'DERTOUR Group', priority: 'high', themes: ['Restructure', 'Leadership'],
    notes: 'Stephen ultimately reports to Grant. Driving major restructure — results end of April 2026. All architecture and vendor decisions must align with his vision.', actions: [] },
  { name: 'Richard Nunn', role: "Stephen's Direct Sponsor", org: 'DERTOUR Group', priority: 'high', themes: ['Facilitation', 'Cost Concerns'],
    notes: 'Facilitating all introductions. Flagged $25K Astronomer cost. Nervous about governance after Masetti meeting.', actions: [] },
  { name: 'Steve Taylor', role: 'Senior IT Manager', org: 'DERTOUR', priority: 'high', themes: ['Data Strategy', 'Architecture'],
    notes: 'Reports to Grant. Shared architecture workshop (11 principles, 18 logical apps, 58 use cases). Operationally sharp.', actions: ['Review architecture workshop', 'Align governance framework'] },
  { name: 'Magnus Josefsson', role: 'Head of Data & Innovation', org: 'DERTOUR Group (Stockholm)', priority: 'high', themes: ['Data Strategy', 'AI', 'Group-wide'],
    notes: 'Stockholm-based. From Apollo. Former Head of Analytics. Group-wide perspective on data + AI.', actions: ['Align Hotelplan UK with group roadmap'] },
  { name: 'Benjamin Boesch', role: 'SVP, Group Strategy', org: 'DERTOUR Group', priority: 'high', themes: ['Vision', 'Use Cases'],
    quote: '"On day two of the crisis, you could have spotted from telephony data that people are inquiring about the Caribbean."',
    notes: 'Executive sponsor. Wants connected data for faster decisions. Inghams = first pilot. Will send use cases.', actions: ['Respond with business value framework + pilot shortlist', 'Follow-up in 1-2 weeks'] },
  { name: 'Matt Quinlisk', role: 'CFO, Northern Europe', org: 'DERTOUR Group', priority: 'high', themes: ['Budget', 'ROI'],
    notes: 'Controls budget. 2-3 brand pilot before scaling. Data quality + IAM as prerequisites. Wary of long engagements with no output.', actions: ['Invite to contribute finance use cases'] },
  { name: 'Jacqui Caseley-Austin', role: 'Group Head of Digital & Data', org: 'Hotel Plan / DERTOUR', priority: 'high', themes: ['Snowflake', 'Data Inventory'],
    notes: 'Drove Snowflake data lake strategy. Has data inventory + use cases. Role uncertain post-acquisition.', actions: ['Chase: data inventory', 'Chase: Snowflake access', 'Chase: Teams folder'] },
  { name: 'Ariella Thompson', role: 'Product / Digital', org: 'DERTOUR Group', priority: 'high', themes: ['Data Mesh', 'Legal Blocker', 'AI'],
    quote: 'Cross-brand user data sharing is not currently legal — each brand has its own user agreement.',
    notes: 'Most aligned stakeholder. Validated data mesh. Surfaced PII blocker. AI advocate. Restructure-aware.', actions: ['Set up regular check-ins', 'Surface legal blocker to Boesch'] },
  { name: 'Adrian Walsh', role: 'Senior BI Manager', org: 'DERTOUR (Inghams)', priority: 'high', themes: ['Dynamic Pricing'],
    quote: '"Holidays past departure date have zero value — like milk past its use-by date."',
    notes: 'Pricing domain expert. Power BI, historical + availability data. Charter commitments = fixed cost exposure. Near real-time essential.', actions: [] },
  { name: 'Hakan Aydinlik', role: 'Engineering Lead', org: 'Hotel Plan / DERTOUR', priority: 'high', themes: ['AWS', 'Engineering'],
    notes: '4 pods: InTravel, Inghams, Explore, Integration. AWS-first, migrating from Azure.', actions: ["Confirm Santa's Lapland Azure vs AWS"] },
  { name: 'Swathi', role: 'Dev Lead', org: 'DERTOUR', priority: 'high', themes: ['AWS', 'Snowflake'],
    notes: 'Snowflake still uncommitted. Architecture changes feasible. Definitive source for AWS dev standards.', actions: ['Get AWS dev standards'] },
  { name: 'May Allen', role: 'PM, Finance Migration', org: 'DERTOUR', priority: 'medium', themes: ['Dynamics 365'],
    notes: 'Dynamics finance migration. Joined 12 Jan 2026. New financial data source.', actions: ['Understand Dynamics data model'] },
  { name: 'Richard Gardner', role: 'CTO', org: 'Lumilinks', priority: 'medium', themes: ['Snowflake', 'Pricing'],
    notes: 'Snowflake partner. Can arrange workshops at Snowflake Liverpool St. Built pricing solution previously.', actions: ['Arrange Snowflake workshop'] },
  { name: 'Olly Kumra', role: 'Pre-sales', org: 'Lumilinks', priority: 'medium', themes: ['Pricing'],
    notes: 'Will share pricing artefact. Stalled roadmap with Jacqui.', actions: ['Chase pricing artefact'] },
  { name: 'Tom Gaudin', role: 'PM', org: 'Lumilinks', priority: 'low', themes: [], notes: 'Timeline management.', actions: [] },
  { name: 'Nick Clarke', role: 'Unknown', org: 'DERTOUR', priority: 'low', themes: ['Dynamic Pricing'], notes: 'Present at pricing session.', actions: [] },
  { name: 'Lisa Dunbar', role: 'Unknown', org: 'DERTOUR', priority: 'low', themes: [], notes: 'Brief intro only.', actions: [] },
]

const themes = [
  { icon: '❄️', title: 'Snowflake immature', desc: 'No clear value yet. Architecture not locked. Critical window to shape.', color: '#29B5E8' },
  { icon: '💰', title: 'Dynamic pricing = #1 use case', desc: 'Walsh has domain knowledge, Lumilinks has prior work, Boesch leads with it. Needs near real-time.', color: '#10B981' },
  { icon: '⚖️', title: 'Legal blocker: cross-brand PII', desc: 'Each brand has own user agreement. No group umbrella. Data mesh = anonymised only until legal change.', color: '#EF4444' },
  { icon: '🛡️', title: 'Governance gap', desc: 'IAM, data quality, KPI standardisation are prerequisites. Must be architecture-first.', color: '#F59E0B' },
  { icon: '📅', title: 'April restructure deadline', desc: "Grant's restructure end of April. Phase 1 rec must land before then.", color: '#8B5CF6' },
  { icon: '✂️', title: 'Cost pressure', desc: '$25K Astronomer flagged. CFO lens on everything. Frame Snowflake-native as cost displacement.', color: '#FF694A' },
]

const actions = [
  { id: 1, action: 'Respond to Boesch: business value framework + pilot shortlist', with: 'Boesch, Quinlisk', status: 'open' },
  { id: 2, action: 'Wednesday deeper intro — Dynamics data model', with: 'May Allen', status: 'done' },
  { id: 3, action: 'Chase Jacqui: data inventory, use cases, Snowflake access, Teams', with: 'Caseley-Austin', status: 'open' },
  { id: 4, action: 'Chase Olly Kumra: pricing artefact', with: 'Kumra', status: 'open' },
  { id: 5, action: "Confirm Santa's Lapland Azure vs AWS", with: 'Aydinlik / Swathi', status: 'open' },
  { id: 6, action: 'Regular check-in with Thompson', with: 'Thompson', status: 'open' },
  { id: 7, action: 'AWS dev standards from Swathi', with: 'Swathi', status: 'open' },
  { id: 8, action: 'Arrange Snowflake Liverpool St workshop', with: 'Gardner / Kumra', status: 'open' },
  { id: 9, action: 'Invite Quinlisk: finance use cases', with: 'Quinlisk', status: 'open' },
  { id: 10, action: 'Surface legal/PII blocker to Boesch', with: 'Boesch, Thompson', status: 'open' },
  { id: 11, action: 'Phase 1 architecture rec + ADR before April restructure', with: 'All', status: 'open' },
]

const matrix = [
  { label: 'High Power · High Interest', color: '#EF4444', desc: 'Manage closely', people: ['Grant van Grenen', 'Richard Nunn', 'Benjamin Boesch', 'Matt Quinlisk', 'Ariella Thompson', 'Steve Taylor', 'Magnus Josefsson'] },
  { label: 'High Power · Low Interest', color: '#3B82F6', desc: 'Keep satisfied', people: ['Legal team (PII blocker)', 'Restructure stakeholders'] },
  { label: 'Low Power · High Interest', color: '#10B981', desc: 'Keep informed', people: ['Jacqui Caseley-Austin', 'Adrian Walsh', 'Hakan Aydinlik', 'Swathi', 'May Allen'] },
  { label: 'Low Power · Low Interest', color: '#6B7280', desc: 'Monitor', people: ['Lumilinks (Gardner, Kumra, Gaudin)', 'Nick Clarke', 'Lisa Dunbar'] },
]

export default function Stakeholders() {
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? stakeholders : stakeholders.filter(s => s.priority === filter)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: BLUE }}>DERTOUR Stakeholders</h2>
        <p className="text-gray-500 text-sm">Week 1: 23-26 March 2026 · {stakeholders.length} people · {actions.filter(a => a.status === 'open').length} open actions</p>
      </div>

      {/* Key Themes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {themes.map(t => (
          <div key={t.title} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start gap-2 mb-1">
              <span>{t.icon}</span>
              <h3 className="text-sm font-bold" style={{ color: BLUE }}>{t.title}</h3>
            </div>
            <p className="text-xs text-gray-500">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'high', 'medium', 'low'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: filter === f ? BLUE : '#F3F4F6', color: filter === f ? '#fff' : '#666' }}>
            {f === 'all' ? `All (${stakeholders.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${stakeholders.filter(s => s.priority === f).length})`}
          </button>
        ))}
      </div>

      {/* Stakeholder Cards */}
      <div className="space-y-2 mb-8">
        {filtered.map(s => (
          <div key={s.name} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => setExpanded(expanded === s.name ? null : s.name)}
              className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-bold" style={{ color: BLUE }}>{s.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: priorityColors[s.priority] }}>{s.priority}</span>
                </div>
                <p className="text-xs text-gray-500">{s.role} · {s.org}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.themes.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">{t}</span>
                ))}
              </div>
              <span className="text-gray-400 text-sm">{expanded === s.name ? '▲' : '▼'}</span>
            </button>
            {expanded === s.name && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
                <p className="text-sm text-gray-600">{s.notes}</p>
                {s.quote && (
                  <div className="bg-blue-50 border-l-3 px-3 py-2 rounded" style={{ borderLeft: `3px solid ${BLUE}` }}>
                    <p className="text-xs text-blue-800 italic">{s.quote}</p>
                  </div>
                )}
                {s.actions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Actions</p>
                    {s.actions.map((a, i) => <p key={i} className="text-xs text-gray-500">⏰ {a}</p>)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions Tracker */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-bold mb-4" style={{ color: BLUE }}>Open Actions ({actions.filter(a => a.status === 'open').length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-200">
                {['#', 'Action', 'With', 'Status'].map(h => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-wider text-gray-400 py-2 px-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map(a => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-2 text-xs text-gray-400">{a.id}</td>
                  <td className="py-2 px-2 text-xs text-gray-700">{a.action}</td>
                  <td className="py-2 px-2 text-xs text-gray-500">{a.with}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Influence Matrix */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4" style={{ color: BLUE }}>Influence Matrix</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {matrix.map(q => (
            <div key={q.label} className="rounded-xl p-4 border" style={{ borderColor: q.color + '33', background: q.color + '08' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: q.color }}>{q.label}</h4>
              <p className="text-[10px] text-gray-400 mb-2">{q.desc}</p>
              {q.people.map(p => <p key={p} className="text-xs text-gray-700 py-0.5">• {p}</p>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
