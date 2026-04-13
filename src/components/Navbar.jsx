import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const avatarRef = useRef(null)

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    setAvatarOpen(false)
    navigate('/login')
  }

  useEffect(() => {
    function handleClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const links = [
    { path: '/app', label: 'Home' },
    { path: '/app/movies', label: 'Movies' },
    { path: '/app/tv', label: 'TV Shows' },
    { path: '/app/requests', label: 'Requests' },
    { path: '/app/downloads', label: 'Downloads' },
    { path: '/app/watchlist', label: 'Watchlist' },
  ]

  const initials = user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'C'

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: 'env(safe-area-inset-top, 0px) 24px 0 24px', minHeight: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)',
        backdropFilter: 'blur(4px)',
      }}>
        <Link to="/" style={{ textDecoration: 'none', zIndex: 101 }}>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px', color: '#1d4ed8' }}>
            Cine<span style={{ color: '#ffffff' }}>Stack</span>
          </div>
        </Link>

        <div className="nav-links-desktop">
          {links.map(link => (
            <Link key={link.path} to={link.path} style={{
              textDecoration: 'none',
              color: location.pathname === link.path ? '#ffffff' : '#b3b3b3',
              fontWeight: location.pathname === link.path ? '600' : '400',
              fontSize: '0.95rem',
              transition: 'color 0.2s ease',
              borderBottom: location.pathname === link.path ? '2px solid #1d4ed8' : '2px solid transparent',
              paddingBottom: '4px',
            }}>
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Avatar dropdown — desktop */}
          <div ref={avatarRef} style={{ position: 'relative' }} className="nav-avatar-desktop">
            <div
              onClick={() => setAvatarOpen(o => !o)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', background: '#1d4ed8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', color: '#fff',
                border: avatarOpen ? '2px solid #fff' : '2px solid transparent',
                transition: 'border-color 0.15s',
              }}
            >
              {initials}
            </div>
            {avatarOpen && (
              <div style={{
                position: 'absolute', top: '46px', right: 0,
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                borderRadius: '10px', minWidth: '180px', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 200,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a2a' }}>
                  <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.display_name || user?.email}</div>
                  <div style={{ color: '#555', fontSize: '0.78rem', marginTop: '2px' }}>{user?.role === 'admin' ? '\u26a1 Admin' : 'User'}</div>
                </div>
                {[
                  { path: '/app/profile', label: '\ud83d\udc64 Profile' },
                  { path: '/app/settings', label: '\u2699\ufe0f Settings' },
                  ...(user?.role === 'admin' ? [{ path: '/app/admin', label: '\ud83d\udee1\ufe0f Admin' }] : []),
                ].map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setAvatarOpen(false)} style={{
                    display: 'block', padding: '11px 16px', color: '#b3b3b3',
                    textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500',
                    borderBottom: '1px solid #222', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#222'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {item.label}
                  </Link>
                ))}
                <button onClick={handleLogout} style={{
                  display: 'block', width: '100%', padding: '11px 16px',
                  background: 'none', border: 'none', color: '#e55',
                  textAlign: 'left', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#222'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px', flexDirection: 'column', gap: '5px', zIndex: 101,
          }}>
            <span style={{ display: 'block', width: '24px', height: '2px', background: '#fff', transition: 'all 0.3s ease', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: '24px', height: '2px', background: '#fff', transition: 'all 0.3s ease', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: '24px', height: '2px', background: '#fff', transition: 'all 0.3s ease', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.97)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '28px',
        }}>
          {links.map(link => (
            <Link key={link.path} to={link.path} onClick={() => setMenuOpen(false)} style={{
              textDecoration: 'none',
              color: location.pathname === link.path ? '#ffffff' : '#b3b3b3',
              fontWeight: location.pathname === link.path ? '700' : '400',
              fontSize: '1.8rem', letterSpacing: '-0.5px',
              borderBottom: location.pathname === link.path ? '2px solid #1d4ed8' : '2px solid transparent',
              paddingBottom: '4px',
            }}>
              {link.label}
            </Link>
          ))}
          <div style={{ width: '40px', height: '1px', background: '#333', margin: '4px 0' }} />
          {[
            { path: '/app/profile', label: 'Profile' },
            { path: '/app/settings', label: 'Settings' },
            ...(user?.role === 'admin' ? [{ path: '/app/admin', label: 'Admin' }] : []),
          ].map(link => (
            <Link key={link.path} to={link.path} onClick={() => setMenuOpen(false)} style={{
              textDecoration: 'none', color: '#888',
              fontWeight: '400', fontSize: '1.2rem',
            }}>
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid #444', borderRadius: '8px',
            color: '#b3b3b3', padding: '12px 32px', fontSize: '1.2rem',
            cursor: 'pointer', marginTop: '8px',
          }}>
            Sign Out
          </button>
        </div>
      )}
    </>
  )
}
export function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const navItems = [
    { path: '/app', label: 'Home', icon: '\ud83c\udfe0' },
    { path: '/app/movies', label: 'Movies', icon: '\ud83c\udfa6' },
    { path: '/app/tv', label: 'TV', icon: '\ud83d\udcfa' },
    { path: '/app/requests', label: 'Requests', icon: '\u2795' },
    { path: '/app/watchlist', label: 'Watchlist', icon: '\ud83d\udd16' },
    { path: '/app/settings', label: 'Settings', icon: '\u2699\ufe0f' },
    ...(user?.role === 'admin' ? [{ path: '/app/admin', label: 'Admin', icon: '\ud83d\udee1\ufe0f' }] : []),
  ]
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,10,10,0.97)', borderTop: '1px solid #1f1f1f',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      height: '60px', paddingBottom: 'env(safe-area-inset-bottom)',
    }} className="bottom-nav">
      {navItems.map(item => {
        const active = location.pathname === item.path
        return (
          <Link key={item.path} to={item.path} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', flex: 1, height: '100%',
            textDecoration: 'none', gap: '2px',
            color: active ? '#ffffff' : '#b3b3b3',
            fontWeight: active ? '700' : '400',
            borderTop: active ? '2px solid #1d4ed8' : '2px solid transparent',
          }}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.2px' }}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
