import API_BASE from "../api";
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const TMDB_IMG = (path) => path ? `https://image.tmdb.org/t/p/w300${path}` : null

const SORT_OPTIONS = [
  { value: 'year-desc',  label: 'Year — newest first' },
  { value: 'year-asc',   label: 'Year — oldest first' },
  { value: 'title-asc',  label: 'Title A → Z' },
  { value: 'title-desc', label: 'Title Z → A' },
]

function sortMovies(arr, sortBy) {
  const a = [...arr]
  if (sortBy === 'year-desc')  return a.sort((x,y) => (y.year||'').localeCompare(x.year||''))
  if (sortBy === 'year-asc')   return a.sort((x,y) => (x.year||'').localeCompare(y.year||''))
  if (sortBy === 'title-asc')  return a.sort((x,y) => x.title.localeCompare(y.title))
  if (sortBy === 'title-desc') return a.sort((x,y) => y.title.localeCompare(x.title))
  return a
}

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-poster" />
          <div style={{ padding: '8px' }}>
            <div className="skeleton skeleton-line" style={{ width: '80%' }} />
            <div className="skeleton skeleton-line" style={{ width: '45%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Movies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('year-desc')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('cinestack_token')
    fetch(API_BASE + '/api/media/movies?limit=2000', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setMovies(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ paddingTop: '84px' }}>
      <div className="section">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Movies</h1>
        </div>
        <SkeletonGrid />
      </div>
    </div>
  )

  if (!movies.length) return (
    <div style={{ paddingTop: '84px' }}>
      <div className="section">
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px' }}>Movies</h1>
        <p style={{ color: '#666' }}>No movies found yet. The library scan runs on startup — check back in a few minutes.</p>
      </div>
    </div>
  )

  const sorted = sortMovies(movies, sortBy)
  const q = search.trim().toLowerCase()
  const filtered = q ? sorted.filter(m => m.title.toLowerCase().includes(q)) : sorted

  return (
    <div style={{ paddingTop: '84px' }}>
      <div className="section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Movies</h1>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              {q ? `${filtered.length} of ${movies.length.toLocaleString()}` : movies.length.toLocaleString()} titles
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="search-bar">
              <span className="search-bar-icon">⌕</span>
              <input
                type="text"
                placeholder="Search movies..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
            <span style={{ color: '#666', fontSize: '0.85rem' }}>Sort by</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', fontSize: '0.85rem', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', outline: 'none', minWidth: '180px' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '14px' }}>🔍</div>
            <p style={{ fontSize: '1rem', marginBottom: '8px' }}>No movies match <strong style={{ color: '#999' }}>"{search}"</strong></p>
            <button
              onClick={() => setSearch('')}
              style={{ marginTop: '12px', background: 'none', border: '1px solid #444', color: '#888', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Clear search
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {filtered.map(movie => (
              <div
                key={movie.id}
                className="card"
                onClick={() => navigate(`/app/detail/movie/${movie.tmdb_id || movie.id}`)}
              >
                <div className="card-poster-wrap">
                  {TMDB_IMG(movie.poster_path)
                    ? <img src={TMDB_IMG(movie.poster_path)} alt={movie.title} loading="lazy" />
                    : <div className="card-no-poster">{movie.title}</div>
                  }
                  <div className="card-gradient" />
                  {movie.year && <div className="card-year-badge">{movie.year}</div>}
                  <div className="card-play-overlay">
                    <div className="card-play-btn">▶</div>
                  </div>
                </div>
                <div className="card-info">
                  <div className="card-title">{movie.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
