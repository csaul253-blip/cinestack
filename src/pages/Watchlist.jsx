import API_BASE from "../api";
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const IMG_BASE = 'https://image.tmdb.org/t/p'

export default function Watchlist() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cinestack_token')
    fetch(API_BASE + '/api/watchlist', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleRemove(tmdbId, mediaType) {
    const token = localStorage.getItem('cinestack_token')
    await fetch(`${API_BASE}/api/watchlist/${tmdbId}?type=${mediaType}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {})
    setItems(prev => prev.filter(i => !(i.tmdb_id === tmdbId && i.media_type === mediaType)))
  }

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#0a0a0a' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', marginBottom: '28px' }}>My Watchlist</h1>
        {loading ? (
          <div style={{ color: '#666', padding: '40px 0' }}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ color: '#555', padding: '60px 0', textAlign: 'center', fontSize: '1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px', opacity: 0.4 }}>🔖</div>
            <div>Nothing saved yet.</div>
            <div style={{ fontSize: '0.85rem', marginTop: '8px', color: '#444' }}>Tap the Watchlist button on any title to save it here.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {items.map(item => {
              const posterUrl = item.poster_path ? `${IMG_BASE}/w342${item.poster_path}` : null
              return (
                <div key={`${item.tmdb_id}-${item.media_type}`} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#141414', border: '1px solid #2a2a2a', cursor: 'pointer' }}
                  onClick={() => navigate(`/app/detail/${item.media_type}/${item.tmdb_id}`)}>
                  {posterUrl ? (
                    <img src={posterUrl} alt={item.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '2/3', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '0.75rem', padding: '8px', textAlign: 'center' }}>{item.title}</div>
                  )}
                  <div style={{ padding: '8px' }}>
                    <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ color: '#555', fontSize: '0.7rem', marginTop: '2px', textTransform: 'capitalize' }}>{item.media_type}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleRemove(item.tmdb_id, item.media_type) }}
                    title="Remove from watchlist"
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#aaa', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
