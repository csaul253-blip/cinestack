import API_BASE from "../api";
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const IMG_BASE = 'https://image.tmdb.org/t/p'

// Fallback only — DB episode_number should be used. Remove once all rows confirmed backfilled.
function parseEpisodeNum(filePath) {
  const filename = filePath.split('/').pop()
  const match = filename.match(/[Ss]\d+[Ee](\d+)/) || filename.match(/[Ee]pisode\s*(\d+)/i)
  return match ? parseInt(match[1]) : null
}

function TrailerEmbed({ trailerKey }) {
  const [blocked, setBlocked] = useState(false)
  useEffect(() => {
    function handleMessage(e) {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.event === 'onError' && data?.info === 150) setBlocked(true)
        if (data?.event === 'onError' && data?.info === 101) setBlocked(true)
      } catch {}
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])
  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Trailer</div>
      {blocked ? (
        <a href={`https://www.youtube.com/watch?v=${trailerKey}`} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '20px 24px', textDecoration: 'none', color: '#fff' }}>
          <span style={{ fontSize: '2rem' }}>▶</span>
          <div>
            <div style={{ fontWeight: '700', marginBottom: '4px' }}>Watch Trailer on YouTube</div>
            <div style={{ color: '#888', fontSize: '0.85rem' }}>Embedding disabled by video owner</div>
          </div>
        </a>
      ) : (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '10px', overflow: 'hidden' }}>
          <iframe src={`https://www.youtube.com/embed/${trailerKey}?rel=0&modestbranding=1&enablejsapi=1`} title="Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
        </div>
      )}
    </div>
  )
}

export default function Detail() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const mediaType = type || 'movie'

  const [tmdbData, setTmdbData] = useState(null)
  const [trailer, setTrailer] = useState(null)
  const [cast, setCast] = useState([])
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [tmdbError, setTmdbError] = useState(false)
  const [requested, setRequested] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requestState, setRequestState] = useState(null)
  const [inLibrary, setInLibrary] = useState(false)
  const [mediaItemId, setMediaItemId] = useState(null)
  const [fileExt, setFileExt] = useState(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [prefetchedJellyfinId, setPrefetchedJellyfinId] = useState(null)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  const [playerLoading, setPlayerLoading] = useState(false)
  const [playerError, setPlayerError] = useState(null)
  const [subtitles, setSubtitles] = useState([])
  const [selectedSubtitle, setSelectedSubtitle] = useState(null)
  const [subtitleUrl, setSubtitleUrl] = useState(null)
  const videoRef = useRef(null)
  const positionIntervalRef = useRef(null)
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [seasons, setSeasons] = useState([])
  const [loadingSeasons, setLoadingSeasons] = useState(false)
  const [requestedSeasons, setRequestedSeasons] = useState(new Set())
  const [inWatchlist, setInWatchlist] = useState(false)

  // TV episode browser
  const [tvEpisodes, setTvEpisodes] = useState({})
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [activeSeasonNum, setActiveSeasonNum] = useState(null)
  const [playingTitle, setPlayingTitle] = useState('')
  const episodesRef = useRef(null)

  useEffect(() => {
    if (!id || !mediaType) return
    const token = localStorage.getItem('cinestack_token')
    fetch(`${API_BASE}/api/requests/check?tmdb_id=${id}&type=${mediaType}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setRequestState(d || null))
      .catch(() => setRequestState(null))
    fetch(`${API_BASE}/api/watchlist/check?tmdb_id=${id}&type=${mediaType}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setInWatchlist(d?.inWatchlist || false))
      .catch(() => {})
  }, [id, mediaType])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [details, videos, credits, sim] = await Promise.all([
          fetch(`${API_BASE}/api/tmdb/${mediaType}/${id}`).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE}/api/tmdb/${mediaType}/${id}/videos`).then(r => r.json()).catch(() => ({})),
          fetch(`${API_BASE}/api/tmdb/${mediaType}/${id}/credits`).then(r => r.json()).catch(() => ({})),
          fetch(`${API_BASE}/api/tmdb/${mediaType}/${id}/similar`).then(r => r.json()).catch(() => ({})),
        ])
        if (!details || details.error || (!details.title && !details.name)) {
          setTmdbError(true)
          setLoading(false)
          return
        }
        setTmdbData(details)
        const t = videos.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
        setTrailer(t || null)
        setCast(credits.cast?.slice(0, 12) || [])
        setSimilar(sim.results?.slice(0, 12) || [])

        const itemTitle = details?.name || details?.title || ''
        const found = await fetch(
          `${API_BASE}/api/media/library-item?type=${mediaType === 'tv' ? 'tv' : 'movie'}&tmdb_id=${id}`
        ).then(r => r.json()).catch(() => null)
          ?? await fetch(
          `${API_BASE}/api/media/library-item?type=${mediaType === 'tv' ? 'tv' : 'movie'}&title=${encodeURIComponent(itemTitle)}`
        ).then(r => r.json()).catch(() => null)
        setInLibrary(!!found)
        if (found) {
          setMediaItemId(found.id)
          console.log('[Detail] mediaItemId set:', found.id)
          fetch(`${API_BASE}/api/media/info/${found.id}`).then(r => r.json()).then(d => setFileExt(d.ext)).catch(() => {})
        }
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  }, [id, mediaType])

  useEffect(() => {
    if (!inLibrary || mediaType !== 'tv') return
    setLoadingEpisodes(true)
    fetch(`${API_BASE}/api/media/tv/${id}/episodes?title=${encodeURIComponent(tmdbData?.name || '')}`)
      .then(r => r.json())
      .then(data => {
        setTvEpisodes(data)
        const firstSeason = Object.keys(data).sort((a, b) => Number(a) - Number(b))[0]
        if (firstSeason !== undefined) setActiveSeasonNum(parseInt(firstSeason))
      })
      .catch(() => {})
      .finally(() => setLoadingEpisodes(false))
  }, [inLibrary, mediaType, id])

  function playEpisode(ep) {
    const epNum = ep.episode_number !== null ? ep.episode_number : parseEpisodeNum(ep.file_path)
    const showName = tmdbData?.name || tmdbData?.title || ''
    setPlayerError(null)
    setPlayerLoading(true)
    setMediaItemId(ep.id)
    setPlayingTitle(ep.episode_name || (epNum ? `${showName} — Episode ${epNum}` : showName))
    setShowPlayer(true)
  }

  async function handleWatchlistToggle() {
    const token = localStorage.getItem('cinestack_token')
    if (inWatchlist) {
      await fetch(`${API_BASE}/api/watchlist/${id}?type=${mediaType}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {})
      setInWatchlist(false)
    } else {
      await fetch(API_BASE + '/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          tmdb_id: parseInt(id),
          media_type: mediaType,
          title: tmdbData?.title || tmdbData?.name || '',
          poster_path: tmdbData?.poster_path || null
        })
      }).catch(() => {})
      setInWatchlist(true)
    }
  }

  async function handleRequest() {
    if (requesting || requested) return
    setRequesting(true)
    const title = tmdbData?.title || tmdbData?.name || ''
    const type = mediaType === 'tv' ? 'tv' : 'movie'
    try {
      const token = localStorage.getItem('cinestack_token')
      const res = await fetch(API_BASE + '/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, type, tmdb_id: parseInt(id), poster_path: tmdbData?.poster_path }),
      })
      if (res.ok) {
        const data = await res.json()
        setRequested(true)
        setRequestState(data)
      } else {
        console.error('Request failed:', res.status)
      }
    } catch (err) {
      console.error(err)
    }
    setRequesting(false)
  }

  async function openSeasonPicker() {
    setShowSeasonModal(true)
    if (seasons.length > 0) return
    setLoadingSeasons(true)
    try {
      const res = await fetch(`${API_BASE}/api/tmdb/tv/${id}`)
      const data = await res.json()
      setSeasons((data.seasons || []).filter(s => s.season_number > 0))
    } catch (err) {
      console.error(err)
    }
    setLoadingSeasons(false)
  }

  async function requestSeason(seasonNum, seasonName) {
    const title = `${tmdbData?.name} ${seasonName}`
    try {
      await fetch(API_BASE + '/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type: 'tv', tmdb_id: parseInt(id), poster_path: tmdbData?.poster_path }),
      })
      setRequestedSeasons(prev => new Set([...prev, seasonNum]))
    } catch (err) {
      console.error(err)
    }
  }

  async function requestAllSeasons() {
    for (const s of seasons) {
      await requestSeason(s.season_number, s.name)
    }
  }

  useEffect(() => {
    if (!mediaItemId) return
    const token = localStorage.getItem('cinestack_token')
    fetch(`${API_BASE}/api/media/jellyfin-id/${mediaItemId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.jellyfinId) setPrefetchedJellyfinId(data.jellyfinId) })
      .catch(() => {})
  }, [mediaItemId])

  useEffect(() => {
    if (!showPlayer || !mediaItemId || !videoRef.current) return
    let hlsInstance = null
    let cancelled = false

    setPlayerLoading(true)
    setPlayerError(null)

    const token = localStorage.getItem('cinestack_token')
    const directUrl = `${API_BASE}/api/media/stream/${mediaItemId}`

    // Fetch saved position — resolves before or after HLS is ready
    let savedPos = 0
    const positionFetch = fetch(`${API_BASE}/api/watch-history/${mediaItemId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d && d.position_seconds > 30) savedPos = d.position_seconds
    }).catch(() => {})

    function savePosition() {
      const video = videoRef.current
      if (!video || video.currentTime < 1) return
      fetch(API_BASE + '/api/watch-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          media_id: mediaItemId,
          position_seconds: Math.floor(video.currentTime),
          duration_seconds: video.duration ? Math.floor(video.duration) : null
        })
      }).catch(() => {})
    }

    function attachWatchHandlers() {
      const video = videoRef.current
      if (!video) return
      video.addEventListener('loadedmetadata', () => {
        if (savedPos > 0 && video.duration && savedPos < video.duration * 0.95) {
          video.currentTime = savedPos
        }
      }, { once: true })
      if (positionIntervalRef.current) clearInterval(positionIntervalRef.current)
      positionIntervalRef.current = setInterval(savePosition, 10000)
    }

    function tryDirectPlay() {
      if (cancelled || !videoRef.current) return
      const video = videoRef.current
      console.log('[Player] Trying direct play:', directUrl)
      video.src = directUrl
      video.load()
      setPlayerLoading(false)
      positionFetch.then(() => attachWatchHandlers())
      video.play().catch(err => {
        console.error('[Player] Direct play failed:', err)
        if (!cancelled) setPlayerError('Could not play this title. Make sure the media file is accessible.')
      })
    }

    const resolvedJellyfinId = prefetchedJellyfinId
    Promise.resolve(resolvedJellyfinId ? { jellyfinId: resolvedJellyfinId } :
      fetch(`${API_BASE}/api/media/jellyfin-id/${mediaItemId}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
    ).then(data => {
        if (cancelled || !videoRef.current) return
        if (!data.jellyfinId) {
          console.warn('[Player] No Jellyfin ID — falling back to direct play')
          tryDirectPlay()
          return
        }
        const m3u8Url = `${API_BASE}/api/media/hls-proxy/${data.jellyfinId}/master.m3u8`
        console.log('[Player] HLS URL:', m3u8Url)
        const video = videoRef.current
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls()
          hlsInstance.loadSource(m3u8Url)
          hlsInstance.attachMedia(video)
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
            if (cancelled) return
            setPlayerLoading(false)
            positionFetch.then(() => attachWatchHandlers())
            video.play().catch(() => {})
          })
          hlsInstance.on(window.Hls.Events.ERROR, (_e, errData) => {
            if (errData.fatal && !cancelled) {
              console.warn('[Player] HLS fatal error — falling back to direct play:', errData.type)
              hlsInstance.destroy()
              hlsInstance = null
              tryDirectPlay()
            }
          })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS — do not call play() manually, autoPlay attr handles it
          video.src = m3u8Url
          video.load()
          setPlayerLoading(false)
          positionFetch.then(() => attachWatchHandlers())
        } else {
          tryDirectPlay()
        }
      })
      .catch(err => {
        console.error('[Player] Jellyfin ID lookup failed:', err)
        if (!cancelled) tryDirectPlay()
      })

    return () => {
      cancelled = true
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current)
        positionIntervalRef.current = null
      }
      if (hlsInstance) { hlsInstance.destroy() }
      if (videoRef.current) { videoRef.current.src = '' }
    }
  }, [showPlayer, mediaItemId])

  function srtToVtt(srt) {
    return "WEBVTT\n\n" + srt
      .replace(/\r\n/g, "\n")
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
  }

  useEffect(() => {
    if (!showPlayer || !mediaItemId) return
    const token = localStorage.getItem('cinestack_token')
    fetch(`${API_BASE}/api/subtitles/${mediaItemId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setSubtitles(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [showPlayer, mediaItemId])

  useEffect(() => {
    if (!selectedSubtitle) { setSubtitleUrl(null); return }
    const token = localStorage.getItem('cinestack_token')
    fetch(`${API_BASE}/api/subtitles/${mediaItemId}/${selectedSubtitle}/content`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.text())
      .then(srt => {
        const vtt = srtToVtt(srt)
        const blob = new Blob([vtt], { type: 'text/vtt' })
        setSubtitleUrl(URL.createObjectURL(blob))
      })
      .catch(() => {})
    return () => { if (subtitleUrl) URL.revokeObjectURL(subtitleUrl) }
  }, [selectedSubtitle])

  function closePlayer() {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current)
      positionIntervalRef.current = null
    }
    const video = videoRef.current
    if (video && video.currentTime > 0 && mediaItemId) {
      const token = localStorage.getItem('cinestack_token')
      fetch(API_BASE + '/api/watch-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          media_id: mediaItemId,
          position_seconds: Math.floor(video.currentTime),
          duration_seconds: video.duration ? Math.floor(video.duration) : null
        })
      }).catch(() => {})
    }
    setShowPlayer(false)
    setPlayerLoading(false)
    setPlayerError(null)
  }

  useEffect(() => {
    return () => { setShowPlayer(false) }
  }, [])

  if (loading) return <div className="loading" style={{ paddingTop: '100px' }}>Loading...</div>
  if (tmdbError) return (
    <div style={{ paddingTop: '120px', textAlign: 'center', color: '#fff' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '12px' }}>Unable to load title info</div>
      <div style={{ color: '#888', marginBottom: '24px' }}>The TMDB API is unavailable or the API token is not configured.</div>
      <button onClick={() => navigate(-1)} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem' }}>← Go back</button>
    </div>
  )

  const title = tmdbData?.title || tmdbData?.name
  const year = (tmdbData?.release_date || tmdbData?.first_air_date || '').slice(0, 4)
  const overview = tmdbData?.overview
  const rating = tmdbData?.vote_average
  const genres = tmdbData?.genres || []
  const runtime = tmdbData?.runtime || null
  const backdropUrl = tmdbData?.backdrop_path ? `${IMG_BASE}/w1280${tmdbData.backdrop_path}` : null
  const posterUrl = tmdbData?.poster_path ? `${IMG_BASE}/w342${tmdbData.poster_path}` : null
  const isRequested = requestState !== null
  const reqStatus = requestState?.status || null

  async function handleRemoveRequest() {
    if (!requestState?.id) return
    try {
      const token = localStorage.getItem('cinestack_token')
      const res = await fetch(`${API_BASE}/api/requests/${requestState.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setRequestState(null)
        setRequested(false)
      } else {
        console.error('Remove request failed:', res.status)
      }
    } catch (err) {
      console.error('Remove request failed:', err)
    }
  }
  const seasonNums = Object.keys(tvEpisodes).sort((a, b) => Number(a) - Number(b))

  return (
    <div style={{ paddingTop: 0, background: '#0a0a0a', minHeight: '100vh' }}>

      {/* Player Overlay */}
      {showPlayer && mediaItemId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#000', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: 'calc(10px + env(safe-area-inset-top, 0px)) 20px 10px 20px', background: 'rgba(0,0,0,0.9)', flexShrink: 0 }}>
            <button onClick={closePlayer} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>← Back</button>
            <span style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{playingTitle || title}</span>
            {subtitles.length > 0 && (
              <select
                value={selectedSubtitle || ''}
                onChange={e => setSelectedSubtitle(e.target.value || null)}
                style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '5px 10px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value=''>No Subtitles</option>
                {subtitles.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', position: 'relative' }}>
            {playerLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ width: '44px', height: '44px', border: '3px solid rgba(255,255,255,0.12)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
            {playerError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '2.8rem', marginBottom: '16px', opacity: 0.6 }}>⚠</div>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '1.1rem', marginBottom: '8px' }}>Playback failed</div>
                <div style={{ color: '#888', fontSize: '0.88rem', marginBottom: '28px', maxWidth: '380px', lineHeight: 1.6 }}>{playerError}</div>
                <button onClick={closePlayer} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>Go Back</button>
              </div>
            )}
            <video
              ref={el => {
                videoRef.current = el
                if (el && isIOS && prefetchedJellyfinId && !el.src) {
                  el.src = `${API_BASE}/api/media/hls-proxy/${prefetchedJellyfinId}/master.m3u8`
                  el.load()
                }
              }}
              style={{ width: '100%', height: '100%' }}
              controls
              autoPlay
              playsInline
            >
              {subtitleUrl && (
                <track key={subtitleUrl} kind='subtitles' src={subtitleUrl} default />
              )}
            </video>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ position: 'relative', height: '70vh', minHeight: '420px', overflow: 'hidden' }}>
        {backdropUrl && (
          <img src={backdropUrl} alt={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.2) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 50%)' }} />

        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '80px', left: '16px', background: 'none', border: 'none', color: '#fff', padding: '8px', cursor: 'pointer', fontSize: '1.4rem', zIndex: 10, lineHeight: 1 }}>
          ←
        </button>

        <div className='hero-content' style={{ maxWidth: '560px' }}>
          {genres.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {genres.slice(0, 3).map(g => (
                <span key={g.id} style={{ background: '#1d4ed822', color: '#1d4ed8', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', border: '1px solid #1d4ed844' }}>{g.name}</span>
              ))}
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', lineHeight: 1.05, marginBottom: '12px', textShadow: '0 2px 12px rgba(0,0,0,0.8)', letterSpacing: '-1px', color: '#fff' }}>
            {title}
          </h1>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            {rating && <span style={{ color: '#f5a623', fontWeight: '700' }}>★ {parseFloat(rating).toFixed(1)}</span>}
            {year && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{year}</span>}
            {runtime && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{runtime} min</span>}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleWatchlistToggle}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              style={{ background: inWatchlist ? '#1d4ed822' : 'rgba(255,255,255,0.08)', border: '1px solid', borderColor: inWatchlist ? '#1d4ed8' : 'rgba(255,255,255,0.2)', color: inWatchlist ? '#1d4ed8' : '#fff', padding: '12px 16px', borderRadius: '6px', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={inWatchlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', marginLeft: '6px' }}>{inWatchlist ? 'Saved' : 'Watchlist'}</span>
            </button>
            {inLibrary ? (
              mediaType === 'tv' ? (
                <button
                  onClick={() => episodesRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '6px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  ▶ Browse Episodes
                </button>
              ) : (
                <button
                  onClick={() => { if (!prefetchedJellyfinId) return; setPlayerError(null); setPlayerLoading(true); setShowPlayer(true) }}
                  disabled={!prefetchedJellyfinId}
                  style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '6px', fontSize: '1rem', fontWeight: '700', cursor: prefetchedJellyfinId ? 'pointer' : 'default', opacity: prefetchedJellyfinId ? 1 : 0.6 }}
                >
                  {prefetchedJellyfinId ? '▶ Play' : '⏳ Loading...'}
                </button>
              )
            ) : (
              <>
                <button
                  onClick={mediaType === 'tv' ? openSeasonPicker : handleRequest}
                  disabled={requesting || (mediaType !== 'tv' && (reqStatus === 'downloading' || reqStatus === 'available' || reqStatus === 'pending' || requested))}
                  style={{ background: (mediaType !== 'tv' && reqStatus === 'available') ? '#27ae60' : (mediaType !== 'tv' && (isRequested || requested)) ? '#374151' : '#1d4ed8', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '6px', cursor: (mediaType !== 'tv' && (isRequested || requested)) ? 'default' : 'pointer', fontSize: '1rem', fontWeight: '700' }}>
                  {mediaType !== 'tv'
                    ? reqStatus === 'available' ? '✓ Available'
                    : reqStatus === 'downloading' ? '⏬ Downloading...'
                    : (isRequested || requested) ? '✓ Requested'
                    : requesting ? 'Requesting...'
                    : '+ Request'
                    : requesting ? 'Requesting...' : '+ Request'}
                </button>
                {mediaType !== 'tv' && isRequested && (
                  <button onClick={handleRemoveRequest} style={{ background: 'none', border: 'none', color: '#e55', fontSize: '0.85rem', cursor: 'pointer', padding: '4px 8px', marginLeft: '8px' }}>✕ Remove</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Season Picker Modal */}
      {showSeasonModal && (
        <div onClick={() => setShowSeasonModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#141414', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #2a2a2a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{tmdbData?.name} — Select Seasons</h2>
              <button onClick={() => setShowSeasonModal(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>
            {loadingSeasons ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Loading seasons...</div>
            ) : (
              <>
                <button onClick={requestAllSeasons} style={{ width: '100%', background: '#1d4ed8', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', marginBottom: '16px' }}>
                  {requestedSeasons.size === seasons.length && seasons.length > 0 ? '✓ All Seasons Requested' : 'Request All Seasons'}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {seasons.map(s => (
                    <div key={s.season_number} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#1a1a1a', borderRadius: '8px', padding: '12px 16px', border: '1px solid #2a2a2a' }}>
                      {s.poster_path && <img src={`https://image.tmdb.org/t/p/w92${s.poster_path}`} alt={s.name} style={{ width: '36px', borderRadius: '4px', flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.name}</div>
                        <div style={{ color: '#666', fontSize: '0.78rem' }}>{s.episode_count} episodes {s.air_date ? '· ' + s.air_date.slice(0, 4) : ''}</div>
                      </div>
                      <button
                        onClick={() => requestSeason(s.season_number, s.name)}
                        disabled={requestedSeasons.has(s.season_number)}
                        style={{ background: requestedSeasons.has(s.season_number) ? '#27ae6033' : '#1d4ed8', color: requestedSeasons.has(s.season_number) ? '#27ae60' : '#fff', border: 'none', padding: '7px 16px', borderRadius: '6px', cursor: requestedSeasons.has(s.season_number) ? 'default' : 'pointer', fontSize: '0.85rem', fontWeight: '600', flexShrink: 0 }}>
                        {requestedSeasons.has(s.season_number) ? '✓ Requested' : '+ Request'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className='content-max' style={{}}>
        <div style={{ display: 'flex', gap: '40px', marginBottom: '48px' }}>
          {posterUrl && (
            <img src={posterUrl} alt={title} style={{ width: '180px', borderRadius: '10px', flexShrink: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', alignSelf: 'flex-start', marginTop: '-40px', position: 'relative', zIndex: 1 }} />
          )}
          <div style={{ flex: 1 }}>
            {overview && (
              <>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>Overview</div>
                <p style={{ color: '#b3b3b3', fontSize: '0.95rem', lineHeight: 1.7 }}>{overview}</p>
              </>
            )}
          </div>
        </div>

        {/* TV Episode Browser */}
        {mediaType === 'tv' && inLibrary && (
          <div ref={episodesRef} style={{ marginBottom: '48px' }}>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Episodes</div>
            {loadingEpisodes ? (
              <div style={{ color: '#666', padding: '20px 0' }}>Loading episodes...</div>
            ) : seasonNums.length === 0 ? (
              <div style={{ color: '#666', padding: '20px 0' }}>No episodes found in library.</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {seasonNums.map(sNum => (
                    <button
                      key={sNum}
                      onClick={() => setActiveSeasonNum(parseInt(sNum))}
                      style={{ background: activeSeasonNum === parseInt(sNum) ? '#1d4ed8' : '#1a1a1a', color: activeSeasonNum === parseInt(sNum) ? '#fff' : '#888', border: '1px solid', borderColor: activeSeasonNum === parseInt(sNum) ? '#1d4ed8' : '#2a2a2a', padding: '6px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.15s' }}
                    >
                      Season {sNum}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(tvEpisodes[activeSeasonNum] || []).map((ep, idx) => {
                    const epNum = ep.episode_number !== null ? ep.episode_number : parseEpisodeNum(ep.file_path)
                    const label = ep.episode_name || (epNum !== null ? `Episode ${epNum}` : `Episode ${idx + 1}`)
                    return (
                      <div key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#141414', borderRadius: '8px', padding: '12px 16px', border: '1px solid #2a2a2a' }}>
                        <div style={{ color: '#444', fontSize: '0.9rem', fontWeight: '700', minWidth: '28px', textAlign: 'right', flexShrink: 0 }}>
                          {epNum !== null ? String(epNum).padStart(2, '0') : String(idx + 1).padStart(2, '0')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#ccc', fontSize: '0.88rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {label}
                          </div>
                        </div>
                        <button
                          onClick={() => playEpisode(ep)}
                          style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', flexShrink: 0 }}
                        >
                          ▶ Play
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {trailer && (
          <TrailerEmbed trailerKey={trailer.key} />
        )}

        {cast.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Cast</div>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {cast.map(person => (
                <div key={person.id} style={{ flexShrink: 0, width: '100px', textAlign: 'center' }}>
                  {person.profile_path ? (
                    <img src={`${IMG_BASE}/w185${person.profile_path}`} alt={person.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', display: 'block', margin: '0 auto 8px' }} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color: '#555', fontSize: '1.4rem' }}>?</div>
                  )}
                  <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: '600', lineHeight: 1.3 }}>{person.name}</div>
                  <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '2px', lineHeight: 1.3 }}>{person.character}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {similar.length > 0 && (
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>More Like This</div>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {similar.map(s => {
                const sTitle = s.title || s.name
                const sYear = (s.release_date || s.first_air_date || '').slice(0, 4)
                const sPoster = s.poster_path ? `${IMG_BASE}/w185${s.poster_path}` : null
                const sType = s.title ? 'movie' : 'tv'
                return (
                  <div key={s.id} onClick={() => navigate(`/app/detail/${sType}/${s.id}`)}
                    style={{ flexShrink: 0, width: '120px', cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', background: '#141414', border: '1px solid #2a2a2a', transition: 'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {sPoster ? (
                      <img src={sPoster} alt={sTitle} loading="lazy" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '2/3', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.75rem', padding: '8px', textAlign: 'center' }}>{sTitle}</div>
                    )}
                    <div style={{ padding: '8px' }}>
                      <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sTitle}</div>
                      <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '2px' }}>{sYear}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
