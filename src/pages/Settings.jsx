import API_BASE from "../api";
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { token } = useAuth()
  const [saved, setSaved] = useState(false)
  const [scanStatus, setScanStatus] = useState(null) // null | 'scanning' | 'done' | 'error'
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    prowlarr_url: '',
    prowlarr_api_key: '',
    download_agent_url: '',
    download_agent_username: '',
    download_agent_password: '',
    jellyfin_url: 'http://192.168.50.254:8097',
    jellyfin_api_key: '',
    transcoding: 'direct',
    theme: 'dark',
  })
  const [mediaPaths, setMediaPaths] = useState([{ value: '', status: null, error: '' }])
  const [pathsValidating, setPathsValidating] = useState(false)
  const [pathsSaving, setPathsSaving] = useState(false)
  const [pathsSaved, setPathsSaved] = useState(false)
  const [proKey, setProKey] = useState('')
  const [proActivating, setProActivating] = useState(false)
  const [proError, setProError] = useState('')
  const [proActivated, setProActivated] = useState(false)
  const [quality, setQuality] = useState('auto')
  const [qualitySaved, setQualitySaved] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  function updateMediaPath(i, val) {
    setMediaPaths(prev => prev.map((p, idx) => idx === i ? { value: val, status: null, error: '' } : p))
  }
  function addMediaPath() {
    setMediaPaths(prev => [...prev, { value: '', status: null, error: '' }])
  }
  function removeMediaPath(i) {
    setMediaPaths(prev => prev.filter((_, idx) => idx !== i))
  }
  async function validateMediaPaths() {
    const filled = mediaPaths.filter(p => p.value.trim())
    if (!filled.length) return
    setPathsValidating(true)
    try {
      const res = await fetch(API_BASE + '/api/setup/validate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: filled.map(p => p.value.trim()) }),
      })
      const data = await res.json()
      const resultMap = {}
      data.results.forEach(r => { resultMap[r.path] = r })
      setMediaPaths(prev => prev.map(p => {
        const r = resultMap[p.value.trim()]
        if (!r) return p
        return { ...p, status: r.valid ? 'ok' : 'err', error: r.error || '' }
      }))
    } catch {}
    setPathsValidating(false)
  }
  async function saveMediaPaths() {
    setPathsSaving(true)
    const validPaths = mediaPaths.filter(p => p.status === 'ok').map(p => p.value.trim())
    await fetch(API_BASE + '/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ media_paths: validPaths }),
    })
    setPathsSaving(false)
    setPathsSaved(true)
    setTimeout(() => setPathsSaved(false), 3000)
  }

  useEffect(() => {
    fetch(API_BASE + '/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setForm(prev => ({ ...prev, ...data }))
        if (data.theme) applyTheme(data.theme)
        if (data.media_paths) {
          const paths = Array.isArray(data.media_paths) ? data.media_paths : JSON.parse(data.media_paths)
          setMediaPaths(paths.map(v => ({ value: v, status: null, error: '' })))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

  }, [])

  const handlePushToggle = async () => {
    if (pushLoading) return
    setPushLoading(true)
    try {
      if (!pushEnabled) {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') { setPushLoading(false); return }
        const reg = await navigator.serviceWorker.ready
        const keyRes = await fetch(API_BASE + '/api/push/vapid-public-key', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const { publicKey } = await keyRes.json()
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        })
        const subJson = sub.toJSON()
        await fetch(API_BASE + '/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
        })
        setPushEnabled(true)
      } else {
        await fetch(API_BASE + '/api/push/unsubscribe', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        setPushEnabled(false)
      }
    } catch (err) {
      console.error('Push toggle error:', err)
    }
    setPushLoading(false)
  }

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cinestack_theme', theme)
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  const handleSave = async () => {
    try {
      await fetch(API_BASE + '/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      applyTheme(form.theme)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  const handleActivatePro = async () => {
    setProError('')
    if (!proKey.trim()) { setProError('Enter a license key'); return }
    setProActivating(true)
    try {
      await fetch(API_BASE + '/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pro_enabled: true, pro_license_key: proKey.trim() }),
      })
      setForm(p => ({ ...p, pro_enabled: true }))
      setProActivated(true)
      setTimeout(() => setProActivated(false), 4000)
    } catch { setProError('Failed to activate') }
    setProActivating(false)
  }

  const handleScan = async () => {
    setScanStatus('scanning')
    try {
      const res = await fetch(API_BASE + '/api/media/scan', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setScanStatus('done')
      } else {
        setScanStatus('error')
      }
    } catch {
      setScanStatus('error')
    }
    setTimeout(() => setScanStatus(null), 4000)
  }

  const inputStyle = {
    width: '100%',
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.82rem',
    color: '#b3b3b3',
    marginBottom: '6px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  }

  const sectionHeaderStyle = {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#b3b3b3',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '16px',
  }

  const cardStyle = {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    padding: '24px',
    marginBottom: '12px',
  }

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  }

  const dividerStyle = {
    borderTop: '1px solid #1f1f1f',
    margin: '32px 0',
  }

  const optionCardStyle = (selected) => ({
    flex: 1,
    background: selected ? '#1d4ed822' : '#111',
    border: `1px solid ${selected ? '#1d4ed8' : '#2a2a2a'}`,
    borderRadius: '8px',
    padding: '14px 18px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  })

  if (loading) return <div className="loading" style={{ paddingTop: '100px' }}>Loading settings...</div>

  return (
    <div style={{ paddingTop: '84px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px' }}>

        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '6px' }}>Settings</h1>
          <p style={{ color: '#b3b3b3', fontSize: '0.95rem' }}>Configure your CineStack installation.</p>
        </div>

        {/* ─── Integrations ─────────────────────────────── */}
        <div style={sectionHeaderStyle}>Integrations</div>

        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Prowlarr</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>Indexer — powers search in the Requests tab.</div>
          </div>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Prowlarr URL</label>
              <input name="prowlarr_url" value={form.prowlarr_url} onChange={handleChange}
                placeholder="http://localhost:9696" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>API Key</label>
              <input name="prowlarr_api_key" value={form.prowlarr_api_key} onChange={handleChange}
                placeholder="••••••••••••" type="password" style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Download Agent</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>qBittorrent, Transmission, or remote seedbox.</div>
          </div>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Agent URL</label>
              <input name="download_agent_url" value={form.download_agent_url} onChange={handleChange}
                placeholder="http://localhost:8080" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Username</label>
              <input name="download_agent_username" value={form.download_agent_username} onChange={handleChange}
                placeholder="admin" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input name="download_agent_password" value={form.download_agent_password} onChange={handleChange}
                placeholder="••••••••••••" type="password" style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Jellyfin</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>Media server — powers in-browser streaming.</div>
          </div>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Jellyfin URL</label>
              <input name="jellyfin_url" value={form.jellyfin_url} onChange={handleChange}
                placeholder="http://192.168.50.254:8097" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>API Key</label>
              <input name="jellyfin_api_key" value={form.jellyfin_api_key} onChange={handleChange}
                placeholder="••••••••••••" type="password" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={handleScan}
              disabled={scanStatus === 'scanning'}
              style={{
                background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a',
                padding: '10px 20px', borderRadius: '6px', cursor: scanStatus === 'scanning' ? 'default' : 'pointer',
                fontSize: '0.9rem', fontWeight: '600', opacity: scanStatus === 'scanning' ? 0.7 : 1,
              }}
            >
              {scanStatus === 'scanning' ? 'Syncing...' : 'Sync Library'}
            </button>
            {scanStatus === 'done' && <span style={{ color: '#27ae60', fontWeight: '600', fontSize: '0.9rem' }}>✓ Sync complete</span>}
            {scanStatus === 'error' && <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.9rem' }}>✗ Scan failed</span>}
          </div>
        </div>

        <div style={dividerStyle} />

        {/* ─── Storage ──────────────────────────────────── */}
        <div style={sectionHeaderStyle}>Storage</div>
        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Media Storage Paths</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>Every folder where your movies and TV shows are stored.</div>
          </div>
          {mediaPaths.map((p, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="/mnt/media"
                  value={p.value}
                  onChange={e => updateMediaPath(i, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {mediaPaths.length > 1 && (
                  <button onClick={() => removeMediaPath(i)} style={{
                    background: 'none', border: 'none', color: '#666',
                    fontSize: '20px', cursor: 'pointer', padding: '0 4px', lineHeight: 1,
                  }}>×</button>
                )}
              </div>
              {p.status === 'ok' && <div style={{ color: '#27ae60', fontSize: '0.82rem', marginTop: '4px' }}>✓ Path found</div>}
              {p.status === 'err' && <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '4px' }}>✗ {p.error}</div>}
            </div>
          ))}
          <button onClick={addMediaPath} style={{
            background: 'none', border: 'none', color: '#1d4ed8',
            fontSize: '14px', cursor: 'pointer', padding: '4px 0', marginBottom: '16px',
          }}>+ Add another location</button>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              disabled={pathsValidating || !mediaPaths.some(p => p.value.trim())}
              onClick={validateMediaPaths}
              style={{
                background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a',
                padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: '600',
              }}
            >{pathsValidating ? 'Validating…' : 'Validate Paths'}</button>
            <button
              disabled={pathsSaving || !mediaPaths.every(p => !p.value.trim() || p.status === 'ok')}
              onClick={saveMediaPaths}
              style={{
                background: '#1d4ed8', color: '#fff', border: 'none',
                padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: '700',
              }}
            >{pathsSaving ? 'Saving…' : pathsSaved ? '✓ Saved' : 'Save Paths'}</button>
          </div>
        </div>

        <div style={dividerStyle} />

        {/* ─── Playback ─────────────────────────────────── */}
        <div style={sectionHeaderStyle}>Playback</div>
        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Transcoding Preference</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
              Direct Play uses zero CPU. Transcoding converts on the fly but strains your server.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={optionCardStyle(form.transcoding === 'direct')}
              onClick={() => { setForm(p => ({ ...p, transcoding: 'direct' })); setSaved(false) }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px', color: form.transcoding === 'direct' ? '#fff' : '#b3b3b3' }}>
                Direct Play
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Device plays natively. No CPU load.</div>
            </div>
            <div style={optionCardStyle(form.transcoding === 'transcode')}
              onClick={() => { setForm(p => ({ ...p, transcoding: 'transcode' })); setSaved(false) }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px', color: form.transcoding === 'transcode' ? '#fff' : '#b3b3b3' }}>
                Transcode if Needed
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Converts for compatibility. Higher CPU.</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '12px' }} />
        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Quality Preference</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>Your default streaming quality. Applied per user.</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['auto', '1080p', '720p', '480p'].map(q => (
              <button key={q} onClick={async () => {
                setQuality(q)
                setQualitySaved(false)
                try {
                  await fetch(API_BASE + '/api/auth/quality', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ quality_preference: q }),
                  })
                  setQualitySaved(true)
                  setTimeout(() => setQualitySaved(false), 2000)
                } catch {}
              }} style={{
                background: quality === q ? '#1d4ed8' : '#111',
                color: quality === q ? '#fff' : '#aaa',
                border: '1px solid', borderColor: quality === q ? '#1d4ed8' : '#2a2a2a',
                padding: '8px 20px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase',
              }}>{q}</button>
            ))}
          </div>
          {qualitySaved && <div style={{ color: '#27ae60', fontWeight: '600', fontSize: '0.9rem', marginTop: '12px' }}>✓ Saved</div>}
        </div>

        <div style={dividerStyle} />

        {/* ─── Appearance ───────────────────────────────── */}
        <div style={sectionHeaderStyle}>Appearance</div>
        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Theme</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>Choose your preferred interface theme.</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={optionCardStyle(form.theme === 'dark')}
              onClick={() => { setForm(p => ({ ...p, theme: 'dark' })); setSaved(false) }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px', color: form.theme === 'dark' ? '#fff' : '#b3b3b3' }}>
                🌙 Dark
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Easy on the eyes.</div>
            </div>
            <div style={optionCardStyle(form.theme === 'light')}
              onClick={() => { setForm(p => ({ ...p, theme: 'light' })); setSaved(false) }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px', color: form.theme === 'light' ? '#fff' : '#b3b3b3' }}>
                ☀️ Light
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>For the brave.</div>
            </div>
          </div>
        </div>

        <div style={dividerStyle} />

        {/* ─── Notifications ───────────────────────────── */}
        <div style={dividerStyle} />
        <div style={sectionHeaderStyle}>Notifications</div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Push Notifications</div>
              <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>Get notified when downloads complete or requests are updated.</div>
            </div>
            <div
              onClick={handlePushToggle}
              style={{
                width: '48px', height: '26px', borderRadius: '13px', cursor: pushLoading ? 'default' : 'pointer',
                background: pushEnabled ? '#1d4ed8' : '#2a2a2a', position: 'relative', transition: 'background 0.2s',
                flexShrink: 0, opacity: pushLoading ? 0.6 : 1,
              }}
            >
              <div style={{
                position: 'absolute', top: '3px', left: pushEnabled ? '25px' : '3px',
                width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </div>
          </div>
        </div>

        {/* ─── CineStack Pro ──────────────────────────── */}
        <div style={sectionHeaderStyle}>CineStack Pro</div>
        <div style={cardStyle}>
          {form.pro_enabled ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27ae60', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '1rem' }}>Pro Active</div>
                <div style={{ color: '#b3b3b3', fontSize: '0.85rem', marginTop: '2px' }}>All Pro features are unlocked.</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Activate CineStack Pro</div>
                <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>Enter your license key to unlock Pro features. Keys are available at cinestack.app.</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  value={proKey}
                  onChange={e => setProKey(e.target.value)}
                  placeholder="CINE-XXXX-XXXX-XXXX"
                  style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', letterSpacing: '1px' }}
                />
                <button
                  onClick={handleActivatePro}
                  disabled={proActivating}
                  style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap' }}
                >
                  {proActivating ? 'Activating...' : 'Activate'}
                </button>
              </div>
              {proError && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '8px' }}>{proError}</div>}
              {proActivated && <div style={{ color: '#27ae60', fontSize: '0.85rem', marginTop: '8px' }}>✓ Pro activated</div>}
            </>
          )}
        </div>

        <div style={dividerStyle} />

        {/* ─── Users (Pro-gated) ───────────────────────── */}
        <div style={{ ...sectionHeaderStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Users
          {!form.pro_enabled && (
            <span style={{ fontSize: '0.65rem', background: '#1d4ed822', color: '#1d4ed8', border: '1px solid #1d4ed855', borderRadius: '4px', padding: '1px 6px', letterSpacing: '0.5px' }}>PRO</span>
          )}
        </div>
        <div style={{ ...cardStyle, opacity: form.pro_enabled ? 1 : 0.45, pointerEvents: form.pro_enabled ? 'auto' : 'none', position: 'relative' }}>
          {!form.pro_enabled && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔒</div>
                <div style={{ fontWeight: '600', color: '#b3b3b3' }}>Requires CineStack Pro</div>
              </div>
            </div>
          )}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>User Accounts</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>Manage who has access to your CineStack. Full user management is in the Admin dashboard.</div>
          </div>
          <a href="/app/admin" style={{ display: 'inline-block', background: '#1d4ed8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', textDecoration: 'none' }}>
            Open Admin Dashboard →
          </a>
        </div>

        <div style={dividerStyle} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleSave} style={{
            background: '#1d4ed8', color: '#fff', border: 'none',
            padding: '12px 36px', borderRadius: '6px', cursor: 'pointer',
            fontSize: '1rem', fontWeight: '700',
          }}>
            Save Settings
          </button>
          {saved && <span style={{ color: '#27ae60', fontWeight: '600', fontSize: '0.95rem' }}>✓ Saved</span>}
        </div>

      </div>
    </div>
  )
}
