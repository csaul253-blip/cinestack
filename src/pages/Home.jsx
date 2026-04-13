import API_BASE from "../api";
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const TMDB_IMG = (path, size = 'w300') => path ? `https://image.tmdb.org/t/p/${size}${path}` : null

function PopularRow({ items, libraryMovies, libraryShows, onSelect, onRequest }) {
  if (!items || items.length === 0) return null
  const libraryIds = new Set([...libraryMovies.map(m => String(m.tmdb_id)), ...libraryShows.map(s => String(s.tmdb_id))])
  return (
    <div style={{ marginBottom: '40px' }}>
      <div className='poster-row-pad' style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>Popular on Streaming</div>
      <div className='poster-row-pad' style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {items.map(item => {
          const inLibrary = libraryIds.has(String(item.id))
          return (
            <div key={item.id} onClick={() => inLibrary ? onSelect(item) : onRequest(item)}
              style={{ flexShrink: 0, width: '140px', cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', background: '#141414', border: '1px solid #2a2a2a', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ position: 'relative' }}>
                <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.title||item.name} loading="lazy"
                  style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                {inLibrary && (
                  <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#1d4ed8', color: '#fff', fontSize: '0.6rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px' }}>IN LIBRARY</div>
                )}
              </div>
              <div style={{ padding: '8px' }}>
                <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title||item.name}</div>
                <div style={{ color: '#666', fontSize: '0.72rem', marginTop: '2px' }}>{(item.release_date||item.first_air_date||'').slice(0,4)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
function ContinueWatchingRow({ items, onSelect }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ marginBottom: '40px' }}>
      <div className='poster-row-pad' style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>Continue Watching</div>
      <div className='poster-row-pad' style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {items.map(item => {
          const pct = item.duration_seconds > 0 ? Math.min((item.position_seconds / item.duration_seconds) * 100, 100) : 0
          return (
            <div key={item.media_id} onClick={() => onSelect(item)}
              style={{ flexShrink: 0, width: '140px', cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', background: '#141414', border: '1px solid #2a2a2a', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ position: 'relative' }}>
                {TMDB_IMG(item.poster_path) ? (
                  <img src={TMDB_IMG(item.poster_path)} alt={item.title} loading="lazy"
                    style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '2/3', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.75rem', padding: '8px', textAlign: 'center' }}>
                    {item.title}
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#333' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#1d4ed8' }} />
                </div>
              </div>
              <div style={{ padding: '8px' }}>
                <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                <div style={{ color: '#666', fontSize: '0.72rem', marginTop: '2px' }}>{item.year}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
function PosterRow({ title, items, onSelect }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ marginBottom: '40px' }}>
      <div className='poster-row-pad' style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>{title}</div>
      <div className='poster-row-pad' style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {items.map(item => (
          <div key={item.id} onClick={() => onSelect(item)}
            style={{ flexShrink: 0, width: '140px', cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', background: '#141414', border: '1px solid #2a2a2a', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {TMDB_IMG(item.poster_path) ? (
              <img src={TMDB_IMG(item.poster_path)} alt={item.title} loading="lazy"
                style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '2/3', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.75rem', padding: '8px', textAlign: 'center' }}>
                {item.title}
              </div>
            )}
            <div style={{ padding: '8px' }}>
              <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
              <div style={{ color: '#666', fontSize: '0.72rem', marginTop: '2px' }}>{item.year}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [movies, setMovies] = useState([])
  const [shows, setShows] = useState([])
  const [continueWatching, setContinueWatching] = useState([])
  const [popularItems, setPopularItems] = useState([])
const [heroIndex, setHeroIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      fetch(API_BASE + '/api/media/movies', { headers: { 'Authorization': `Bearer ${localStorage.getItem('cinestack_token')}` } }).then(r => r.json()).catch(() => []),
      fetch(API_BASE + '/api/media/tv', { headers: { 'Authorization': `Bearer ${localStorage.getItem('cinestack_token')}` } }).then(r => r.json()).catch(() => []),
      fetch(API_BASE + '/api/watch-history', { headers: { 'Authorization': `Bearer ${localStorage.getItem('cinestack_token')}` } }).then(r => r.json()).catch(() => []),
      (() => { const r=(Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1]||'US'); const d=new Date().toISOString().split('T')[0]; return fetch(`${API_BASE}/api/tmdb/discover/movie?with_watch_monetization_types=flatrate&with_watch_providers=8|15|337|1899|9|350|386&watch_region=${r}&sort_by=popularity.desc&primary_release_date.lte=${d}`).then(r=>r.json()).catch(()=>({results:[]})); })(),
      (() => { const r=(Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1]||'US'); const d=new Date().toISOString().split('T')[0]; return fetch(`${API_BASE}/api/tmdb/discover/tv?with_watch_monetization_types=flatrate&with_watch_providers=8|15|337|1899|9|350|386&watch_region=${r}&sort_by=popularity.desc&first_air_date.lte=${d}`).then(r=>r.json()).catch(()=>({results:[]})); })(),
    ]).then(([m, t, cw, trendMovies, trendTV]) => {
      setMovies(Array.isArray(m) ? m : [])
      setShows(Array.isArray(t) ? t : [])
      setContinueWatching(Array.isArray(cw) ? cw : [])
      const today = new Date().toISOString().split('T')[0]
      const movies = (trendMovies.results||[]).filter(i=>i.poster_path && (!i.release_date || i.release_date <= today)).map(i=>({...i,media_type:'movie'}))
      const shows = (trendTV.results||[]).filter(i=>i.poster_path && (!i.first_air_date || i.first_air_date <= today)).map(i=>({...i,media_type:'tv'}))
      const interleaved = []
      const max = Math.max(movies.length, shows.length)
      for (let i = 0; i < max && interleaved.length < 20; i++) {
        if (movies[i]) interleaved.push(movies[i])
        if (shows[i] && interleaved.length < 20) interleaved.push(shows[i])
      }
      setPopularItems(interleaved)
      setLoading(false)
    })
  }, [])

  const recentMovies = [...movies].sort((a, b) => (b.added_at || '').localeCompare(a.added_at || '')).slice(0, 20)
  const recentShows = [...shows].sort((a, b) => (b.added_at || '').localeCompare(a.added_at || '')).slice(0, 20)
  const heroItems = (() => {
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)
    const topMovies = shuffle([...movies].filter(i => i.backdrop_path).sort((a,b) => (b.vote_average||0)-(a.vote_average||0)).slice(0,10)).slice(0,2)
    const topShows = shuffle([...shows].filter(i => i.backdrop_path).sort((a,b) => (b.vote_average||0)-(a.vote_average||0)).slice(0,10)).slice(0,2)
    const topPopular = shuffle(popularItems.filter(i => i.backdrop_path).slice(0,10)).slice(0,1).map(i => ({...i, type: i.media_type, title: i.title||i.name, year: (i.release_date||i.first_air_date||'').slice(0,4)}))
    return shuffle([...topMovies, ...topShows, ...topPopular]).slice(0,5)
  })()
  const hero = heroItems[heroIndex]

  useEffect(() => {
    if (heroItems.length < 2) return
    const t = setInterval(() => setHeroIndex(i => (i + 1) % heroItems.length), 8000)
    return () => clearInterval(t)
  }, [heroItems.length])

  function handleSelect(item) {
    navigate(`/app/detail/${item.type}/${item.tmdb_id || item.id}`)
  }
  function handlePopularSelect(item) {
    navigate(`/app/detail/${item.media_type}/${item.id}`)
  }
  function handlePopularRequest(item) {
    navigate(`/app/requests?search=${encodeURIComponent(item.title||item.name)}`)
  }

  if (loading) return <div className="loading" style={{ paddingTop: '100px' }}>Loading...</div>

  if (!movies.length && !shows.length) return (
    <div style={{ paddingTop: '84px' }}>
      <div className="section">
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px' }}>Home</h1>
        <p style={{ color: '#666' }}>No library content yet. The scanner runs on startup — check back in a few minutes.</p>
      </div>
    </div>
  )



  return (
    <div style={{ paddingTop: 0, background: '#0a0a0a', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      {hero && (
        <div style={{ position: 'relative', height: '80vh', minHeight: '500px', overflow: 'hidden', marginBottom: '40px' }}>
          <img
            key={hero.id}
            src={TMDB_IMG(hero.backdrop_path, 'w1280')}
            alt={hero.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 45%)' }} />
          <div className='hero-content'>
            <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              {(hero.type||hero.media_type) === 'tv' ? 'TV Show' : 'Movie'} · {hero.tmdb_id || hero.added_at ? 'In Your Library' : 'Popular on Streaming'}
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: '900', lineHeight: 1.05, marginBottom: '12px', textShadow: '0 2px 12px rgba(0,0,0,0.8)', letterSpacing: '-1px', color: '#fff' }}>
              {hero.title}
            </h1>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', alignItems: 'center' }}>
              {hero.year && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{hero.year}</span>}
            </div>
            {hero.overview && (
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
                {hero.overview}
              </p>
            )}
            <button onClick={() => hero.added_at || hero.tmdb_id ? handleSelect(hero) : handlePopularSelect(hero)}
              style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: '700' }}>
              View Details
            </button>
          </div>
          {heroItems.length > 1 && (
            <div style={{ position: 'absolute', bottom: '24px', left: '40px', display: 'flex', gap: '6px' }}>
              {heroItems.map((_, i) => (
                <div key={i} onClick={() => setHeroIndex(i)} style={{ width: i === heroIndex ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === heroIndex ? '#1d4ed8' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
          )}
        </div>
      )}

      <ContinueWatchingRow items={continueWatching} onSelect={handleSelect} />
<PopularRow items={popularItems} libraryMovies={movies} libraryShows={shows} onSelect={handlePopularSelect} onRequest={handlePopularRequest} />
<PosterRow title="Recently Added — Movies" items={recentMovies} onSelect={handleSelect} />
      <PosterRow title="Recently Added — TV Shows" items={recentShows} onSelect={handleSelect} />
      <div style={{ height: '60px' }} />
    </div>
  )
}
