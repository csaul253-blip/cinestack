import API_BASE from "../api";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '⚡',
    title: 'One Container',
    desc: 'Replace Sonarr, Radarr, Prowlarr, Jellyseerr, and Jellyfin with a single Docker deploy. Up in minutes.',
  },
  {
    icon: '🎬',
    title: 'Clean, Modern UI',
    desc: 'Cinematic browsing experience with immersive modals, backdrop art, and fluid animations.',
  },
  {
    icon: '🔍',
    title: 'Browse & Request',
    desc: 'Search millions of titles via TMDB. Request with one click. Downloads start automatically.',
  },
  {
    icon: '📡',
    title: 'Smart Downloads',
    desc: 'Real-time download queue with progress tracking, speed, ETA, and automatic library organization.',
  },
  {
    icon: '🔒',
    title: 'Private by Design',
    desc: 'Self-hosted means your data never leaves your hardware. No tracking, no ads, no subscriptions.',
  },
  {
    icon: '🌐',
    title: 'Access Anywhere',
    desc: 'Cloudflare-powered HTTPS out of the box. Watch your library from any device, anywhere.',
  },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#ffffff',
    desc: 'Self-hosted, open source, yours forever.',
    features: [
      'Full source code on GitHub',
      'Single Docker container deploy',
      'TMDB integration',
      'Request & download queue',
      'Bring your own torrent client',
      'Single admin user',
      'Basic mobile web',
      'Community support',
    ],
    cta: 'Join Waitlist',
    highlight: false,
  },
  {
    name: 'Annual',
    price: '$49',
    period: '/year',
    color: '#1d4ed8',
    desc: 'Everything you need. Cancel anytime.',
    features: [
      'Everything in Free',
      'Multiple user accounts',
      'Native mobile app (iOS + Android)',
      'Push notifications',
      'User profiles with PIN protection',
      'Parental controls',
      'Request approval system',
      'Quality preferences per user',
      'Watchlists and collections',
      'Continue watching sync',
      'Automatic subtitle fetching',
      'Admin dashboard',
      'Advanced download scheduling',
      'Pre-configured qBittorrent',
      'Seedbox SFTP auto-transfer',
      'Priority support',
    ],
    cta: 'Join Waitlist',
    highlight: true,
  },
  {
    name: 'Lifetime',
    price: '$149',
    period: 'one-time',
    color: '#a78bfa',
    desc: 'Pay once. Yours forever.',
    features: [
      'Everything in Annual',
      'Early access to new features',
      'Direct support channel',
      'Name in GitHub sponsors list',
    ],
    cta: 'Join Waitlist',
    highlight: false,
  },
];

export default function Landing() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      hero.style.backgroundPosition = `${50 + x * 0.3}% ${50 + y * 0.3}%`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch(API_BASE + '/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', fontFamily: "'Outfit', sans-serif", overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@1,700&display=swap" rel="stylesheet" />

      {/* Noise overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
          <span style={{ color: '#1d4ed8' }}>Cine</span><span style={{ color: '#fff' }}>Stack</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="#features" style={{ color: '#b3b3b3', textDecoration: 'none', fontSize: '0.9rem' }}>Features</a>
          <a href="#demo" style={{ color: '#b3b3b3', textDecoration: 'none', fontSize: '0.9rem' }}>Demo</a>
          <a href="#pricing" style={{ color: '#b3b3b3', textDecoration: 'none', fontSize: '0.9rem' }}>Pricing</a>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent', border: '1px solid #333',
              borderRadius: '8px', color: '#fff', padding: '8px 20px',
              fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', textAlign: 'center', padding: '120px 24px 80px',
        position: 'relative', zIndex: 1,
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(29,78,216,0.15) 0%, transparent 70%)',
        transition: 'background-position 0.3s ease',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(29,78,216,0.3)',
          borderRadius: '100px', padding: '6px 16px', marginBottom: '32px',
          fontSize: '0.8rem', color: '#93bbfd', letterSpacing: '0.05em',
          animation: 'fadeUp 0.6s ease both',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1d4ed8', display: 'inline-block' }} />
          NOW IN EARLY ACCESS
        </div>

        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 7rem)',
          fontWeight: '900', lineHeight: '1',
          letterSpacing: '-0.03em', marginBottom: '8px',
          animation: 'fadeUp 0.6s ease 0.1s both',
        }}>
          Your media.<br />
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            background: 'linear-gradient(135deg, #1d4ed8, #6366f1, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            One stack.
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#b3b3b3', maxWidth: '600px',
          lineHeight: '1.7', marginBottom: '48px',
          animation: 'fadeUp 0.6s ease 0.2s both',
        }}>
          CineStack replaces the entire <em style={{ color: '#fff' }}>*arr suite</em> with a single Docker container and a clean, modern interface. Browse, request, download, and watch — all in one place.
        </p>

        {status === 'success' ? (
          <div style={{
            background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)',
            borderRadius: '16px', padding: '24px 40px', animation: 'fadeUp 0.4s ease both',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#27ae60' }}>You're on the list!</div>
            <div style={{ color: '#b3b3b3', fontSize: '0.9rem', marginTop: '4px' }}>We'll reach out when CineStack is ready.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            display: 'flex', flexDirection: 'column', gap: '12px',
            width: '100%', maxWidth: '480px',
            animation: 'fadeUp 0.6s ease 0.3s both',
          }}>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                padding: '14px 20px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                color: '#fff', fontSize: '1rem', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  flex: 1, padding: '14px 20px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                  color: '#fff', fontSize: '1rem', outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  padding: '14px 28px', background: '#1d4ed8',
                  border: 'none', borderRadius: '12px', color: '#fff',
                  fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                  whiteSpace: 'nowrap', opacity: status === 'loading' ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {status === 'loading' ? '...' : 'Join Waitlist'}
              </button>
            </div>
            {status === 'error' && (
              <div style={{ color: '#dc2626', fontSize: '0.85rem' }}>{errorMsg}</div>
            )}
            <div style={{ color: '#555', fontSize: '0.8rem' }}>No spam. Unsubscribe anytime.</div>
          </form>
        )}

        <div style={{
          display: 'flex', gap: '48px', marginTop: '80px',
          animation: 'fadeUp 0.6s ease 0.4s both',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {[['1', 'Docker container'], ['5', 'Apps replaced'], ['$0', 'Forever free tier']].map(([num, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1d4ed8' }}>{num}</div>
              <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{
          position: 'absolute', bottom: '32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          animation: 'bounce 2s infinite',
        }}>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, #333)' }} />
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#333' }} />
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '120px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{ color: '#1d4ed8', fontSize: '0.8rem', letterSpacing: '0.15em', marginBottom: '16px', fontWeight: '600' }}>
              EVERYTHING YOU NEED
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '16px' }}>
              Built for people who<br />know what they want
            </h2>
            <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
              Stop juggling five separate apps. CineStack does it all with a UI that doesn't feel like it was built in 2012.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px', padding: '32px',
                transition: 'all 0.3s ease', cursor: 'default',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(29,78,216,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(29,78,216,0.3)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>{f.icon}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>{f.title}</div>
                <div style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.6' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" style={{ padding: '40px 24px 120px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ color: '#1d4ed8', fontSize: '0.8rem', letterSpacing: '0.15em', marginBottom: '16px', fontWeight: '600' }}>
              LIVE DEMO
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '16px' }}>
              See it in action
            </h2>
            <p style={{ color: '#666', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
              This is the real app running live. Placeholder data — production looks exactly like this with your library.
            </p>
          </div>

          {/* Browser chrome */}
          <div style={{
            borderRadius: '16px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          }}>
            {/* Browser bar */}
            <div style={{
              background: '#1a1a1a',
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
              </div>
              <div style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px', padding: '4px 12px',
                fontSize: '0.75rem', color: '#555', textAlign: 'center',
              }}>
                cinestack.app/app
              </div>
            </div>
            {/* iframe */}
            <iframe
              src="/demo"
              style={{
                width: '100%',
                height: '680px',
                border: 'none',
                display: 'block',
                background: '#0a0a0a',
              }}
              title="CineStack Live Demo"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '80px 24px 120px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{ color: '#1d4ed8', fontSize: '0.8rem', letterSpacing: '0.15em', marginBottom: '16px', fontWeight: '600' }}>
              SIMPLE PRICING
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '16px' }}>
              Free for yourself.<br />Pro for everyone you share with.
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px', alignItems: 'start',
          }}>
            {PRICING.map((plan, i) => (
              <div key={i} style={{
                background: plan.highlight ? 'rgba(29,78,216,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${plan.highlight ? 'rgba(29,78,216,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '20px', padding: '40px 32px',
                position: 'relative',
                transform: plan.highlight ? 'scale(1.02)' : 'scale(1)',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    background: '#1d4ed8', borderRadius: '100px', padding: '4px 16px',
                    fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.05em' }}>
                  {plan.name.toUpperCase()}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: '800', color: plan.color }}>{plan.price}</span>
                  <span style={{ color: '#666', fontSize: '0.9rem' }}>{plan.period}</span>
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '32px', lineHeight: '1.5' }}>{plan.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.9rem' }}>
                      <span style={{ color: plan.color === '#a78bfa' ? '#a78bfa' : '#1d4ed8', marginTop: '2px', flexShrink: 0 }}>✓</span>
                      <span style={{ color: '#b3b3b3' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => document.querySelector('input[type="email"]')?.focus()}
                  style={{
                    width: '100%', padding: '14px',
                    background: plan.highlight ? '#1d4ed8' : 'transparent',
                    border: `1px solid ${plan.highlight ? '#1d4ed8' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: '10px', color: '#fff', fontSize: '0.95rem',
                    fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (!plan.highlight) e.currentTarget.style.borderColor = '#1d4ed8'; }}
                  onMouseLeave={e => { if (!plan.highlight) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ padding: '80px 24px 120px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          maxWidth: '700px', margin: '0 auto',
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(29,78,216,0.12), transparent)',
          padding: '80px 40px', borderRadius: '32px',
          border: '1px solid rgba(29,78,216,0.15)',
        }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Ready to cut the cord<br />on your media stack?
          </h2>
          <p style={{ color: '#666', marginBottom: '40px', fontSize: '1rem', lineHeight: '1.7' }}>
            Join hundreds of self-hosters waiting for the all-in-one solution they've been asking for.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              padding: '16px 40px', background: '#1d4ed8', border: 'none',
              borderRadius: '12px', color: '#fff', fontSize: '1rem',
              fontWeight: '700', cursor: 'pointer', letterSpacing: '0.02em',
            }}
          >
            Join the Waitlist →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 40px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>
          <span style={{ color: '#1d4ed8' }}>Cine</span><span style={{ color: '#fff' }}>Stack</span>
        </div>
        <div style={{ color: '#444', fontSize: '0.85rem' }}>
          © 2026 CineStack. Built for the self-hosting community.
        </div>
        <a href="mailto:chris@cinestack.app" style={{ color: '#444', fontSize: '0.85rem', textDecoration: 'none' }}>
          chris@cinestack.app
        </a>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        input::placeholder { color: #444; }
        input:focus { border-color: rgba(29,78,216,0.5) !important; }
        a:hover { color: #fff !important; }
      `}</style>
    </div>
  );
}
