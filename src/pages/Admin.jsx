import API_BASE from "../api";
import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const { token, user } = useAuth()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [autoAccept, setAutoAccept] = useState(false)
  const [autoAcceptLoading, setAutoAcceptLoading] = useState(false)
  const [addForm, setAddForm] = useState({ email: '', password: '', display_name: '', role: 'user' })
  const [addError, setAddError] = useState('')
  const [addSaving, setAddSaving] = useState(false)

  if (user?.role !== 'admin') return <Navigate to="/app" replace />

  async function load() {
    try {
      const h = { Authorization: `Bearer ${token}` }
      const [sR, uR, rR, dR, stR] = await Promise.all([
        fetch(API_BASE + '/api/admin/stats', { headers: h }),
        fetch(API_BASE + '/api/admin/users', { headers: h }),
        fetch(API_BASE + '/api/requests', { headers: h }),
        fetch(API_BASE + '/api/downloads', { headers: h }),
        fetch(API_BASE + '/api/settings', { headers: h }),
      ])
      const [s, u, r, d, st] = await Promise.all([sR.json(), uR.json(), rR.json(), dR.json(), stR.json()])
      setAutoAccept(!!st.auto_accept_requests)
      setStats(s)
      setUsers(Array.isArray(u) ? u : [])
      setRequests(Array.isArray(r) ? r.filter(x => x.status === 'pending') : [])
      setDownloads(Array.isArray(d) ? d.filter(x => !['completed', 'failed'].includes(x.status)) : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAutoAcceptToggle() {
    setAutoAcceptLoading(true)
    const newVal = !autoAccept
    try {
      await fetch(API_BASE + '/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ auto_accept_requests: newVal }),
      })
      setAutoAccept(newVal)
    } catch {}
    setAutoAcceptLoading(false)
  }

  async function handleAddUser() {
    setAddError('')
    if (!addForm.email || !addForm.password) { setAddError('Email and password required'); return }
    setAddSaving(true)
    try {
      const res = await fetch(API_BASE + '/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error || 'Failed'); setAddSaving(false); return }
      setUsers(p => [...p, data])
      setStats(p => ({ ...p, users: p.users + 1 }))
      setAddForm({ email: '', password: '', display_name: '', role: 'user' })
      setShowAddUser(false)
    } catch { setAddError('Network error') }
    setAddSaving(false)
  }

  async function handleDeleteUser(id) {
    if (!confirm('Delete this user?')) return
    try {
      await fetch(`${API_BASE}/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setUsers(p => p.filter(u => u.id !== id))
      setStats(p => ({ ...p, users: p.users - 1 }))
    } catch {}
  }

  async function handleApprove(req) {
    try {
      await fetch(`${API_BASE}/api/admin/requests/${req.id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      setRequests(p => p.filter(r => r.id !== req.id))
      setStats(p => ({ ...p, pendingRequests: p.pendingRequests - 1 }))
    } catch {}
  }

  async function handleDeny(req) {
    try {
      await fetch(`${API_BASE}/api/admin/requests/${req.id}/deny`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      setRequests(p => p.filter(r => r.id !== req.id))
      setStats(p => ({ ...p, pendingRequests: p.pendingRequests - 1 }))
    } catch {}
  }

  const card = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '24px', marginBottom: '16px' }
  const sectionLabel = { fontSize: '0.75rem', fontWeight: '700', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'block' }
  const inp = { width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }

  if (loading) return <div style={{ paddingTop: '100px', textAlign: 'center', color: '#666' }}>Loading...</div>

  return (
    <div style={{ paddingTop: '84px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>

        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '6px' }}>Admin Dashboard</h1>
          <p style={{ color: '#b3b3b3', fontSize: '0.95rem' }}>Manage users, requests, and downloads.</p>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
            {[
              { label: 'Users', value: stats.users },
              { label: 'Pending', value: stats.pendingRequests },
              { label: 'Downloading', value: stats.activeDownloads },
              { label: 'Library', value: stats.libraryCount },
            ].map(s => (
              <div key={s.label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800' }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Requests */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ ...sectionLabel, marginBottom: 0 }}>Pending Requests</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: '#b3b3b3' }}>Auto-accept</span>
              <div
                onClick={handleAutoAcceptToggle}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', cursor: autoAcceptLoading ? 'default' : 'pointer',
                  background: autoAccept ? '#1d4ed8' : '#2a2a2a', position: 'relative', transition: 'background 0.2s',
                  flexShrink: 0, opacity: autoAcceptLoading ? 0.6 : 1,
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px', left: autoAccept ? '22px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>
          </div>
          {requests.length === 0
            ? <div style={{ color: '#444', fontSize: '0.9rem' }}>No pending requests</div>
            : requests.map(req => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #222' }}>
                {req.poster_path && <img src={`https://image.tmdb.org/t/p/w45${req.poster_path}`} style={{ width: '32px', borderRadius: '4px' }} alt="" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{req.title}</div>
                  <div style={{ color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' }}>{req.type}</div>
                </div>
                <button onClick={() => handleApprove(req)} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>Approve</button>
                <button onClick={() => handleDeny(req)} style={{ background: 'none', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>Deny</button>
              </div>
            ))
          }
        </div>

        {/* Users */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ ...sectionLabel, marginBottom: 0 }}>Users</span>
            <button onClick={() => setShowAddUser(p => !p)} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
              {showAddUser ? 'Cancel' : '+ Add User'}
            </button>
          </div>

          {showAddUser && (
            <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[
                  { key: 'email', label: 'Email', type: 'email', placeholder: 'user@example.com' },
                  { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
                  { key: 'display_name', label: 'Display Name', type: 'text', placeholder: 'Optional' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={addForm[f.key]}
                      onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={inp} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</label>
                  <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))} style={inp}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {addError && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '10px' }}>{addError}</div>}
              <button onClick={handleAddUser} disabled={addSaving} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                {addSaving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          )}

          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #222' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: u.role === 'admin' ? '#1d4ed8' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', color: '#fff', flexShrink: 0 }}>
                {(u.display_name || u.email)[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{u.display_name || u.email}</div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>{u.email}</div>
              </div>
              <span style={{ fontSize: '0.75rem', background: u.role === 'admin' ? '#1d4ed822' : '#222', color: u.role === 'admin' ? '#1d4ed8' : '#888', border: `1px solid ${u.role === 'admin' ? '#1d4ed855' : '#333'}`, borderRadius: '4px', padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {u.role}
              </span>
              {u.id !== user?.id && (
                <button onClick={() => handleDeleteUser(u.id)} title="Delete user" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 8px' }}>✕</button>
              )}
            </div>
          ))}
        </div>

        {/* Active Downloads */}
        <div style={card}>
          <span style={sectionLabel}>Active Downloads</span>
          {downloads.length === 0
            ? <div style={{ color: '#444', fontSize: '0.9rem' }}>No active downloads</div>
            : downloads.map(dl => (
              <div key={dl.id} style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{dl.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{dl.speed || '—'} · {dl.eta || '—'}</div>
                </div>
                <div style={{ background: '#111', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#1d4ed8', width: `${dl.progress || 0}%`, borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '4px' }}>{dl.progress || 0}% · {dl.file_size || '—'}</div>
              </div>
            ))
          }
        </div>

      </div>
    </div>
  )
}
