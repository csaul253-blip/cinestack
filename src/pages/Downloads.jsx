import API_BASE from "../api";
import { useState, useEffect } from 'react';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';

const statusConfig = {
  downloading:  { label: 'Downloading',  color: '#f5a623' },
  transferring: { label: 'Transferring', color: '#a78bfa' },
  queued:       { label: 'Queued',       color: '#6b7280' },
  completed:    { label: 'Available',    color: '#27ae60' },
  failed:       { label: 'Failed',       color: '#dc2626' },
};

export default function Downloads() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDownloads = async () => {
    try {
      const res = await fetch(API_BASE + '/api/downloads');
      const data = await res.json();
      setDownloads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch downloads:', err);
      setDownloads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
    const interval = setInterval(fetchDownloads, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRemove = async (id) => {
    await fetch(`${API_BASE}/api/downloads/${id}`, { method: 'DELETE' });
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  const active       = downloads.filter(d => d.status === 'downloading');
  const transferring = downloads.filter(d => d.status === 'transferring');
  const queued       = downloads.filter(d => d.status === 'queued');
  const completed    = downloads.filter(d => d.status === 'completed');
  const failed       = downloads.filter(d => d.status === 'failed');

  if (loading) {
    return (
      <div className='page-pad' style={{ textAlign: 'center', color: '#b3b3b3' }}>
        Loading downloads...
      </div>
    );
  }

  return (
    <div className='page-pad' style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Downloads</h1>
      <p style={{ color: '#b3b3b3', marginBottom: '40px' }}>
        {active.length} downloading · {transferring.length} transferring · {queued.length} queued · {completed.length} completed
      </p>

      {downloads.length === 0 && (
        <div style={{
          background: '#141414', borderRadius: '12px', padding: '60px',
          textAlign: 'center', color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📥</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>No downloads yet</div>
          <div style={{ fontSize: '14px' }}>Request a movie or TV show to get started</div>
        </div>
      )}

      {active.length > 0 && (
        <Section title="Downloading" items={active} onRemove={handleRemove} />
      )}
      {transferring.length > 0 && (
        <Section title="Transferring from Seedbox" items={transferring} onRemove={handleRemove} />
      )}
      {queued.length > 0 && (
        <Section title="Queue" items={queued} onRemove={handleRemove} />
      )}
      {completed.length > 0 && (
        <Section title="Completed" items={completed} onRemove={handleRemove} showClear />
      )}
      {failed.length > 0 && (
        <Section title="Failed" items={failed} onRemove={handleRemove} />
      )}
    </div>
  );
}

function Section({ title, items, onRemove }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#b3b3b3' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map(dl => <DownloadCard key={dl.id} dl={dl} onRemove={onRemove} />)}
      </div>
    </div>
  );
}

function DownloadCard({ dl, onRemove }) {
  const cfg = statusConfig[dl.status] || statusConfig.queued;

  return (
    <div style={{
      background: '#1a1a1a', borderRadius: '12px', padding: '16px',
      display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      {/* Poster */}
      <div style={{
        width: '46px', height: '69px', borderRadius: '6px',
        background: '#2a2a2a', flexShrink: 0, overflow: 'hidden'
      }}>
        {dl.poster_path && (
          <img
            src={`${POSTER_BASE}${dl.poster_path}`}
            alt={dl.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dl.title}
          </span>
          <span style={{
            fontSize: '11px', fontWeight: '600', padding: '2px 8px',
            borderRadius: '20px', background: `${cfg.color}22`, color: cfg.color,
            textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0
          }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280', flexShrink: 0 }}>
            {dl.type === 'tv' ? 'TV Show' : 'Movie'} · {dl.file_size || '—'}
          </span>
        </div>

        {/* Progress bar */}
        {(dl.status === 'downloading' || dl.status === 'transferring' || dl.status === 'queued') && (
          <div style={{ marginBottom: '4px' }}>
            <div style={{
              height: '4px', background: '#2a2a2a', borderRadius: '2px', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', width: `${dl.progress}%`,
                background: dl.status === 'downloading' ? '#f5a623'
                          : dl.status === 'transferring' ? '#a78bfa'
                          : '#4b5563',
                transition: 'width 0.5s ease', borderRadius: '2px'
              }} />
            </div>
          </div>
        )}
        {dl.status === 'completed' && (
          <div style={{
            height: '4px', background: '#27ae6033', borderRadius: '2px',
            marginBottom: '4px', overflow: 'hidden'
          }}>
            <div style={{ height: '100%', width: '100%', background: '#27ae60', borderRadius: '2px' }} />
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
          {dl.status === 'downloading' && (
            <>
              <span>{dl.progress}%</span>
              {dl.speed && <span>{dl.speed}</span>}
              {dl.eta && <span>ETA {dl.eta}</span>}
            </>
          )}
          {dl.status === 'transferring' && (
            <>
              <span>{dl.progress}%</span>
              {dl.speed && <span>{dl.speed}</span>}
              <span style={{ color: '#a78bfa' }}>↓ Seedbox transfer</span>
            </>
          )}
          {dl.status === 'queued' && <span>Waiting in queue</span>}
          {dl.status === 'completed' && <span>Ready to watch</span>}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => onRemove(dl.id)}
        style={{
          background: 'transparent', border: '1px solid #333', color: '#6b7280',
          padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
          fontSize: '13px', flexShrink: 0, transition: 'all 0.2s'
        }}
        onMouseOver={e => { e.target.style.borderColor = '#dc2626'; e.target.style.color = '#dc2626'; }}
        onMouseOut={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#6b7280'; }}
      >
        {dl.status === 'completed' ? 'Clear' : 'Cancel'}
      </button>
    </div>
  );
}
