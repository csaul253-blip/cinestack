import API_BASE from "../api";
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const BASE_URL = API_BASE + '/api/tmdb'
const IMG_BASE = 'https://image.tmdb.org/t/p'

const SORT_OPTIONS = [
  { value: 'default',    label: 'Popularity (default)' },
  { value: 'year-desc',  label: 'Year — newest first' },
  { value: 'year-asc',   label: 'Year — oldest first' },
  { value: 'title-asc',  label: 'Title A → Z' },
  { value: 'title-desc', label: 'Title Z → A' },
  { value: 'rating-desc',label: 'Rating — highest first' },
]

function sortItems(arr, sortBy) {
  if (sortBy === 'default') return arr
  const a = [...arr]
  const getYear  = i => (i.release_date || i.first_air_date || '')
  const getTitle = i => (i.title || i.name || '')
  if (sortBy === 'year-desc')   return a.sort((x,y) => getYear(y).localeCompare(getYear(x)))
  if (sortBy === 'year-asc')    return a.sort((x,y) => getYear(x).localeCompare(getYear(y)))
  if (sortBy === 'title-asc')   return a.sort((x,y) => getTitle(x).localeCompare(getTitle(y)))
  if (sortBy === 'title-desc')  return a.sort((x,y) => getTitle(y).localeCompare(getTitle(x)))
  if (sortBy === 'rating-desc') return a.sort((x,y) => (y.vote_average||0) - (x.vote_average||0))
  return a
}

const statusColor = { downloading: '#f5a623', available: '#27ae60', pending: '#dc2626', failed: '#dc2626' }
const statusLabel = { downloading: 'Downloading', available: '✓ Available', pending: 'Pending', failed: 'Failed' }

function MediaCard({ item, onClick }) {
  const title  = item.title || item.name
  const year   = (item.release_date || item.first_air_date || '').slice(0, 4)
  const poster = item.poster_path ? `${IMG_BASE}/w342${item.poster_path}` : null
  return (
    <div className="card" onClick={() => onClick(item)}>
      {poster ? (
        <img src={poster} alt={title} loading="lazy" />
      ) : (
        <div style={{ width:'100%', aspectRatio:'2/3', background:'#2a2a2a', display:'flex', alignItems:'center', justifyContent:'center', color:'#666', fontSize:'0.8rem', padding:'8px', textAlign:'center' }}>{title}</div>
      )}
      <div className="card-info">
        <div className="card-title">{title}</div>
        <div className="card-year">{year}</div>
      </div>
    </div>
  )
}

export default function Requests() {
  const [query, setQuery]               = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [browseItems, setBrowseItems]   = useState([])
  const [myRequests, setMyRequests]     = useState([])
  const [searching, setSearching]       = useState(false)
  const [sortBy, setSortBy]             = useState('default')
  const [activeType, setActiveType]     = useState(null)
  const [page, setPage]                 = useState(1)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [hasMore, setHasMore]           = useState(true)
  const [seenIds, setSeenIds]           = useState(new Set())
  const sentinelRef = useRef(null)
  const navigate    = useRef(useNavigate()).current


  useEffect(() => {
    fetch(API_BASE + '/api/requests').then(r => r.json()).then(d => setMyRequests(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  async function loadPage(pageNum, reset = false, type = activeType) {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const endpoint = type === 'tv' ? `${BASE_URL}/tv/popular` : `${BASE_URL}/movie/popular`
      const res = await axios.get(endpoint, { params: { page: pageNum } })
      const mediaType = type === 'tv' ? 'tv' : 'movie'
      const combined = (res.data.results || []).map(r => ({ ...r, media_type: mediaType }))

      setBrowseItems(prev => {
        const existing = reset ? new Set() : seenIds
        const fresh = combined.filter(item => item.poster_path && !existing.has(item.id))
        const newIds = new Set([...existing, ...fresh.map(i => i.id)])
        setSeenIds(newIds)
        return reset ? fresh : [...prev, ...fresh]
      })

      const totalPages = res.data.total_pages || 1
      setHasMore(pageNum < totalPages)
    } catch (err) {
      console.error('Failed to load popular:', err)
    }
    setLoadingMore(false)
  }

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && searchResults.length === 0) {
        const next = page + 1
        setPage(next)
        loadPage(next)
      }
    }, { threshold: 0.1 })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, page, searchResults.length])

  const location = useLocation()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const presearch = params.get('search')
    if (presearch) {
      setQuery(presearch)
      setSearching(true)
      const endpoint = activeType === 'tv' ? `${BASE_URL}/search/tv` : `${BASE_URL}/search/movie`
      axios.get(endpoint, { params: { query: presearch } })
        .then(res => {
          setSearchResults((res.data.results || []).filter(r => r.poster_path).map(r => ({ ...r, media_type: activeType || 'movie' })))
          setSearching(false)
        })
    }
  }, [])
  const handleSearch = () => {
    if (!query.trim()) { setSearchResults([]); return }
    setSearching(true)
    const endpoint = activeType === 'tv' ? `${BASE_URL}/search/tv` : `${BASE_URL}/search/movie`
    axios.get(endpoint, { params: { query } })
      .then(res => {
        setSearchResults((res.data.results || []).filter(r => r.poster_path).map(r => ({ ...r, media_type: activeType || 'movie' })))
        setSearching(false)
      })
  }

  const handleKeyDown = e => { if (e.key === 'Enter') handleSearch() }

  const handleRemove = async (id) => {
    try {
      await fetch(`${API_BASE}/api/requests/${id}`, { method: 'DELETE' })
      setMyRequests(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Failed to remove request:', err)
    }
  }

  function selectType(type) {
    setActiveType(type)
    setSearchResults([])
    setQuery('')
    setBrowseItems([])
    setSeenIds(new Set())
    setPage(1)
    setHasMore(true)
    loadPage(1, true, type)
  }
  function handleCardClick(item) {
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv')
    navigate(`/app/detail/${mediaType}/${item.id}`)
  }

  const displayGrid = sortItems(searchResults.length > 0 ? searchResults : browseItems, sortBy)

  return (
    <div style={{ paddingTop: '84px' }}>
      {/* Header + Type Buttons */}
      <div className="section">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', flexWrap:'wrap', gap:'12px' }}>
          <h1 style={{ fontSize:'2rem', fontWeight:'800' }}>Discover & Request</h1>
          {activeType && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ color:'#666', fontSize:'0.85rem' }}>Sort by</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background:'#1a1a1a', border:'1px solid #333', color:'#fff', fontSize:'0.85rem', padding:'7px 12px', borderRadius:'6px', cursor:'pointer', outline:'none', minWidth:'180px' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
        </div>
        {!activeType ? (
          <div style={{ display:'flex', gap:'16px', maxWidth:'500px', marginBottom:'32px', marginTop:'16px' }}>
            <button onClick={() => selectType('movie')} style={{ flex:1, background:'#1d4ed8', color:'#fff', border:'none', padding:'16px', borderRadius:'10px', fontSize:'1rem', fontWeight:'700', cursor:'pointer' }}>Request Movie</button>
            <button onClick={() => selectType('tv')} style={{ flex:1, background:'#1a1a1a', color:'#fff', border:'1px solid #333', padding:'16px', borderRadius:'10px', fontSize:'1rem', fontWeight:'700', cursor:'pointer' }}>Request TV Show</button>
          </div>
        ) : (
          <div style={{ marginBottom:'24px', marginTop:'8px' }}>
            <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
              <button onClick={() => selectType('movie')} style={{ background: activeType === 'movie' ? '#1d4ed8' : '#1a1a1a', color:'#fff', border: activeType === 'movie' ? 'none' : '1px solid #333', padding:'8px 20px', borderRadius:'8px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer' }}>Movies</button>
              <button onClick={() => selectType('tv')} style={{ background: activeType === 'tv' ? '#1d4ed8' : '#1a1a1a', color:'#fff', border: activeType === 'tv' ? 'none' : '1px solid #333', padding:'8px 20px', borderRadius:'8px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer' }}>TV Shows</button>
            </div>
            <div style={{ display:'flex', gap:'12px', maxWidth:'600px' }}>
              <input
                type="text" value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={activeType === 'tv' ? 'Search TV shows...' : 'Search movies...'}
                style={{ flex:1, background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:'8px', padding:'12px 16px', color:'#fff', fontSize:'1rem', outline:'none' }}
              />
              <button className="btn btn-accent" onClick={handleSearch}>{searching ? '...' : 'Search'}</button>
              {searchResults.length > 0 && (
                <button className="btn btn-secondary" onClick={() => { setSearchResults([]); setQuery('') }}>Clear</button>
              )}
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'16px' }}>
          {displayGrid.map(item => (
            <MediaCard key={`${item.id}-${item.media_type}`} item={item} onClick={handleCardClick} />
          ))}
        </div>

        {/* Sentinel + loader */}
        {searchResults.length === 0 && (
          <div ref={sentinelRef} style={{ padding:'40px', textAlign:'center', color:'#444' }}>
            {loadingMore ? 'Loading more...' : hasMore ? '' : 'You\'ve reached the end'}
          </div>
        )}
      </div>

      {/* My Requests */}
      {myRequests.length > 0 && (
        <div className="section">
          <div style={{ borderTop:'1px solid #2a2a2a', paddingTop:'32px', marginBottom:'24px' }}>
            <h2 style={{ fontSize:'1.4rem', fontWeight:'700' }}>My Requests</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px', maxWidth:'700px' }}>
            {myRequests.map(req => (
              <div key={req.id} style={{ background:'#1a1a1a', borderRadius:'10px', padding:'16px', border:'1px solid #2a2a2a', display:'flex', gap:'16px', alignItems:'center' }}>
                {req.poster_path && (
                  <img src={`${IMG_BASE}/w92${req.poster_path}`} alt={req.title} style={{ width:'46px', borderRadius:'4px', flexShrink:0 }} />
                )}
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:'600', fontSize:'0.95rem' }}>{req.title}</div>
                  <div style={{ color:'#666', fontSize:'0.8rem', marginTop:'2px' }}>{req.type}</div>
                  {req.status === 'downloading' && (
                    <div style={{ marginTop:'8px' }}>
                      <div style={{ height:'3px', background:'#2a2a2a', borderRadius:'2px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${req.progress}%`, background:'#f5a623', borderRadius:'2px', transition:'width 0.3s ease' }} />
                      </div>
                      <div style={{ color:'#666', fontSize:'0.75rem', marginTop:'4px' }}>{req.progress}% complete</div>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <span style={{ color: statusColor[req.status] || '#666', fontSize:'0.8rem', fontWeight:'600', background:`${statusColor[req.status] || '#666'}22`, padding:'4px 10px', borderRadius:'20px' }}>
                    {statusLabel[req.status] || req.status}
                  </span>
                  <button onClick={() => handleRemove(req.id)} style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:'1rem', padding:'4px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
