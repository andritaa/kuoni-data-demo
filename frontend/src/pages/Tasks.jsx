import React, { useState, useEffect } from 'react'

const BLUE = '#003366'
const GOLD = '#C9A96E'

const PRIORITY_COLORS = { P1: '#ef4444', P2: '#f59e0b', P3: '#6b7280' }
const COLUMNS = ['To Do', 'In Progress', 'Done']

const defaultTasks = [
  { id: 't1', title: 'Snowflake access audit', desc: 'Review all service accounts and rotate credentials. Set up key-pair auth.', priority: 'P1', due: '2026-03-24', col: 'To Do' },
  { id: 't2', title: 'Map DERTOUR brand data sources', desc: 'Document data flows for Kuoni UK, Apollo, Prijsvrij. Identify Snowpipe candidates.', priority: 'P1', due: '2026-03-25', col: 'To Do' },
  { id: 't3', title: 'Revenue dashboard — connect live data', desc: 'Wire the PoC dashboard to real Snowflake views instead of mock data.', priority: 'P2', due: '2026-03-28', col: 'In Progress' },
  { id: 't4', title: 'dbt project scaffolding', desc: 'Set up dbt project structure: staging, intermediate, marts layers for DERTOUR DW.', priority: 'P2', due: '2026-04-01', col: 'To Do' },
  { id: 't5', title: 'Meeting prep — Dorking 23 March', desc: 'Prepare architecture deck, demo portal, talking points for DERTOUR meeting.', priority: 'P1', due: '2026-03-22', col: 'In Progress' },
]

const STORAGE_KEY = 'dertour_tasks'

export default function Tasks() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : defaultTasks
    } catch { return defaultTasks }
  })
  const [dragging, setDragging] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', desc: '', priority: 'P2', due: '', col: 'To Do' })

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) }, [tasks])

  const handleDragStart = (e, id) => { setDragging(id); e.dataTransfer.effectAllowed = 'move' }
  const handleDrop = (e, col) => {
    e.preventDefault()
    if (dragging) setTasks(prev => prev.map(t => t.id === dragging ? { ...t, col } : t))
    setDragging(null)
  }
  const handleDragOver = (e) => e.preventDefault()
  const addTask = () => {
    if (!newTask.title.trim()) return
    setTasks(prev => [...prev, { ...newTask, id: 't' + Date.now() }])
    setNewTask({ title: '', desc: '', priority: 'P2', due: '', col: 'To Do' })
    setShowAdd(false)
  }
  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id))

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: BLUE }}>Task Board</h2>
          <p className="text-gray-500 text-sm mt-1">Drag cards between columns · Stored locally</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors" style={{ background: BLUE }}>
          + Add Task
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Title" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Due date (YYYY-MM-DD)" value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={newTask.desc} onChange={e => setNewTask(p => ({ ...p, desc: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm col-span-2" rows={2} />
            <div className="flex gap-2 items-center">
              {['P1', 'P2', 'P3'].map(p => (
                <button key={p} onClick={() => setNewTask(prev => ({ ...prev, priority: p }))}
                  className="px-3 py-1 rounded-full text-xs font-bold border-2 transition-all"
                  style={{ borderColor: PRIORITY_COLORS[p], background: newTask.priority === p ? PRIORITY_COLORS[p] : 'transparent',
                    color: newTask.priority === p ? '#fff' : PRIORITY_COLORS[p] }}>{p}</button>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={addTask} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: GOLD }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => (
          <div key={col} className="rounded-xl bg-gray-50 border border-gray-200 min-h-[400px]"
               onDrop={e => handleDrop(e, col)} onDragOver={handleDragOver}>
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-sm" style={{ color: BLUE }}>{col}</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600">
                {tasks.filter(t => t.col === col).length}
              </span>
            </div>
            <div className="p-3 space-y-3">
              {tasks.filter(t => t.col === col).map(task => (
                <div key={task.id} draggable onDragStart={e => handleDragStart(e, task.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm" style={{ color: BLUE }}>{task.title}</h4>
                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs transition-opacity">✕</button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                    {task.due && <span className="text-[10px] text-gray-400">📅 {task.due}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
