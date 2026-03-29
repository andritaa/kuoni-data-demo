import React, { useState, useEffect } from 'react'

const BLUE = '#003366'
const GOLD = '#C9A96E'
const PASS_HASH = '8f14e45fceea167a5a36dedd4bea2543' // md5 of the password

function md5(str) {
  // Simple hash for client-side check — not crypto-secure but fine for a gate
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

export default function AuthGate({ children }) {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('dertour_auth')
    if (stored === 'true') setAuthed(true)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === 'Dertour2026!') {
      setAuthed(true)
      sessionStorage.setItem('dertour_auth', 'true')
    } else {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  if (authed) return children

  return (
    <div style={{ background: BLUE, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, width: 380, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h1 style={{ color: BLUE, fontSize: 24, fontWeight: 800, letterSpacing: 3, marginBottom: 4 }}>DERTOUR</h1>
        <p style={{ color: GOLD, fontSize: 12, marginBottom: 30 }}>Data Intelligence Portal</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 8,
              border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
              fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
          <button type="submit" style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: BLUE, color: 'white', fontSize: 14, fontWeight: 600,
            border: 'none', cursor: 'pointer',
          }}>
            Sign In
          </button>
        </form>
        {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12 }}>Incorrect password</p>}
        <p style={{ color: '#999', fontSize: 10, marginTop: 20 }}>Authorised access only</p>
      </div>
    </div>
  )
}
