import API_BASE from "../api";
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
export default function Profile() {
  const { user, token, login } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinSaved, setPinSaved] = useState(false)
  const [pinError, setPinError] = useState('')

  const initials = (user?.display_name || user?.email || 'C')[0].toUpperCase()

  const handleProfileSave = async () => {
    setProfileError('')
    setProfileSaved(false)
    try {
      const res = await fetch(API_BASE + '/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ display_name: displayName }),
      })
      const data = await res.json()
      if (!res.ok) return setProfileError(data.error || 'Failed to save')
      login(token, { ...user, display_name: data.user.display_name })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch {
      setProfileError('Something went wrong')
    }
  }

  const handlePinSave = async () => {
    setPinError('')
    setPinSaved(false)
    if (pin && (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)))
      return setPinError('PIN must be 4\u20138 digits')
    if (pin && pin !== confirmPin)
      return setPinError('PINs do not match')
    try {
      const res = await fetch(API_BASE + '/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pin: pin || null }),
      })
      const data = await res.json()
      if (!res.ok) return setPinError(data.error || 'Failed to save PIN')
      setPinSaved(true)
      setPin('')
      setConfirmPin('')
      setTimeout(() => setPinSaved(false), 3000)
    } catch {
      setPinError('Something went wrong')
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSaved(false)
    if (!currentPassword || !newPassword || !confirmPassword)
      return setPasswordError('All fields are required')
    if (newPassword !== confirmPassword)
      return setPasswordError('New passwords do not match')
    if (newPassword.length < 8)
      return setPasswordError('New password must be at least 8 characters')
    try {
      const res = await fetch(API_BASE + '/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) return setPasswordError(data.error || 'Failed to change password')
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    } catch {
      setPasswordError('Something went wrong')
    }
  }

  const inputStyle = {
    width: '100%', background: '#111', border: '1px solid #2a2a2a',
    borderRadius: '6px', padding: '10px 14px', color: '#fff',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.82rem', color: '#b3b3b3', marginBottom: '6px',
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px',
  }
  const cardStyle = {
    background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: '10px', padding: '24px', marginBottom: '12px',
  }
  const sectionHeaderStyle = {
    fontSize: '0.75rem', fontWeight: '700', color: '#b3b3b3',
    textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px',
  }
  const dividerStyle = { borderTop: '1px solid #1f1f1f', margin: '32px 0' }

  return (
    <div style={{ paddingTop: '84px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '6px' }}>Profile</h1>
          <p style={{ color: '#b3b3b3', fontSize: '0.95rem' }}>Manage your account details.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '800', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{user?.display_name || user?.email}</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem', marginTop: '2px' }}>{user?.role === 'admin' ? '\u26a1 Admin' : 'User'}</div>
          </div>
        </div>

        <div style={sectionHeaderStyle}>Account</div>
        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Display Name</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>How your name appears in CineStack.</div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Display Name</label>
            <input value={displayName} onChange={e => { setDisplayName(e.target.value); setProfileSaved(false) }} placeholder="Your name" style={inputStyle} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input value={user?.email || ''} disabled style={{ ...inputStyle, color: '#666', cursor: 'not-allowed' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={handleProfileSave} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700' }}>Save</button>
            {profileSaved && <span style={{ color: '#27ae60', fontWeight: '600', fontSize: '0.9rem' }}>\u2713 Saved</span>}
            {profileError && <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.9rem' }}>{profileError}</span>}
          </div>
        </div>

        <div style={dividerStyle} />
        <div style={sectionHeaderStyle}>PIN Lock</div>
        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Profile PIN</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>Set a 4\u20138 digit PIN to lock your profile. Leave blank to remove.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>New PIN</label>
              <input type="password" inputMode="numeric" value={pin} onChange={e => { setPin(e.target.value); setPinError('') }} placeholder="\u2022\u2022\u2022\u2022" maxLength={8} style={{ ...inputStyle, maxWidth: '200px' }} />
            </div>
            <div>
              <label style={labelStyle}>Confirm PIN</label>
              <input type="password" inputMode="numeric" value={confirmPin} onChange={e => { setConfirmPin(e.target.value); setPinError('') }} placeholder="\u2022\u2022\u2022\u2022" maxLength={8} style={{ ...inputStyle, maxWidth: '200px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={handlePinSave} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700' }}>Save PIN</button>
            {pinSaved && <span style={{ color: '#27ae60', fontWeight: '600', fontSize: '0.9rem' }}>\u2713 PIN updated</span>}
            {pinError && <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.9rem' }}>{pinError}</span>}
          </div>
        </div>

        <div style={dividerStyle} />
        <div style={sectionHeaderStyle}>Security</div>
        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Change Password</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>Must be at least 8 characters.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <input type="password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setPasswordError('') }} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordError('') }} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={handlePasswordChange} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700' }}>Update Password</button>
            {passwordSaved && <span style={{ color: '#27ae60', fontWeight: '600', fontSize: '0.9rem' }}>\u2713 Password updated</span>}
            {passwordError && <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.9rem' }}>{passwordError}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
