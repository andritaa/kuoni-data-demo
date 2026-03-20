import React, { useState, useRef, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8010'
const BLUE = '#003366'
const GOLD = '#C9A96E'

const SUGGESTIONS = [
  "What's our total revenue across all brands?",
  "Which brand has the highest cancellation rate?",
  "Top 5 destinations by revenue for Apollo",
  "How many bookings did DERTOUR have in 2024?",
  "What's the average booking value by brand?",
  "Show me monthly revenue trend for Kuoni",
  "Which customer segment spends the most?",
  "Compare revenue between UK and DACH markets",
]

function Message({ msg }) {
  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
        msg.role === 'user' 
          ? 'bg-blue-600 text-white rounded-br-md' 
          : 'bg-white border border-gray-200 shadow-sm rounded-bl-md'
      }`}>
        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
        {msg.sql && (
          <details className="mt-3">
            <summary className="text-xs opacity-60 cursor-pointer hover:opacity-100">Show SQL</summary>
            <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto">{msg.sql}</pre>
          </details>
        )}
        {msg.table && msg.table.rows.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr>
                  {msg.table.columns.map((c, i) => (
                    <th key={i} className="text-left px-2 py-1 border-b font-semibold" 
                        style={{ color: BLUE, borderColor: '#e5e7eb' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {msg.table.rows.slice(0, 10).map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-gray-50'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1 border-b border-gray-100 text-gray-600">
                        {typeof cell === 'number' ? cell.toLocaleString('en-GB', { maximumFractionDigits: 0 }) : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {msg.table.rows.length > 10 && (
              <p className="text-[10px] text-gray-400 mt-1">Showing 10 of {msg.table.rows.length} rows</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm Andrita, your DERTOUR Group data analyst. Ask me anything about your Snowflake data — bookings, revenue, customers, destinations, any brand. I'll write the SQL and get you the answer." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const ask = async (question) => {
    if (!question.trim()) return
    const q = question.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    try {
      const resp = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await resp.json()

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I hit an error: ${data.error}` }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: data.answer,
          sql: data.sql,
          table: data.rows?.length > 0 ? { columns: data.columns, rows: data.rows } : null,
        }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Connection error: ${e.message}. Make sure the backend is running.` }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const handleSubmit = (e) => { e.preventDefault(); ask(input) }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold" style={{ color: BLUE }}>Data Chatbot</h2>
        <p className="text-gray-500 text-sm mt-1">Ask questions about DERTOUR Group data in plain English</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="mb-3 flex flex-wrap gap-2 px-1">
          {SUGGESTIONS.slice(0, 4).map((s, i) => (
            <button key={i} onClick={() => ask(s)}
              className="px-3 py-1.5 rounded-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your data... e.g. 'What was Apollo's revenue in Q3 2024?'"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
          style={{ background: BLUE }}>
          Ask
        </button>
      </form>
    </div>
  )
}
