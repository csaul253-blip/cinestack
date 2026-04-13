import API_BASE from "../api";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Shared Styles ───────────────────────────────────────────────────────────

const s = {
  input: {
    width: '100%', padding: '12px', background: '#1a1a1a',
    border: '1px solid #333', borderRadius: '8px', color: '#fff',
    fontSize: '16px', boxSizing: 'border-box', outline: 'none',
  },
  label: { color: '#b3b3b3', fontSize: '14px', display: 'block', marginBottom: '8px' },
  fieldWrap: { marginBottom: '16px' },
  primaryBtn: (disabled) => ({
    width: '100%', padding: '14px', background: disabled ? '#1d4ed8' : '#1d4ed8',
    border: 'none', borderRadius: '8px', color: '#fff',
    fontSize: '16px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, marginTop: '8px',
  }),
  secondaryBtn: (disabled) => ({
    width: '100%', padding: '14px', background: '#2a2a2a',
    border: 'none', borderRadius: '8px', color: '#fff',
    fontSize: '16px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, marginTop: '8px',
  }),
  skipBtn: {
    width: '100%', padding: '14px', background: 'transparent',
    border: 'none', color: '#666', fontSize: '15px',
    cursor: 'pointer', marginTop: '8px',
  },
  errorBox: {
    background: '#dc262620', border: '1px solid #dc2626',
    borderRadius: '8px', padding: '12px', marginBottom: '16px',
    color: '#dc2626', fontSize: '14px',
  },
  successInline: { color: '#27ae60', fontSize: '13px', marginTop: '4px' },
  errorInline: { color: '#dc2626', fontSize: '13px', marginTop: '4px' },
};

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '32px' }}>
      {Array.from({ length: total }).map((_, i) => {
        const stepNum = i + 1;
        const isCurrent = stepNum === current;
        const isCompleted = stepNum < current;
        return (
          <div key={i} style={{
            height: '8px',
            width: isCurrent ? '24px' : '8px',
            borderRadius: '4px',
            background: isCurrent ? '#1d4ed8' : isCompleted ? '#1d4ed8' : '#333',
            opacity: isCompleted ? 0.5 : 1,
            transition: 'all 0.3s ease',
          }} />
        );
      })}
    </div>
  );
}

// ─── Card Wrapper ─────────────────────────────────────────────────────────────

function Card({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px',
        background: '#141414', borderRadius: '12px',
        padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid #2a2a2a',
      }}>
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '32px', height: '32px', background: '#1d4ed8',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <polygon points="4,2 14,9 4,16" fill="white" />
            </svg>
          </div>
          <span style={{ color: '#fff', fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' }}>
            CineStack
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function Step1({ onNext }) {
  return (
    <>
      <ProgressDots current={1} total={6} />
      <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '700', marginBottom: '12px', marginTop: 0 }}>
        Welcome to CineStack
      </h1>
      <p style={{ color: '#b3b3b3', fontSize: '16px', marginBottom: '32px', lineHeight: '1.5' }}>
        Let's get you set up in a few minutes.
      </p>
      <button style={s.primaryBtn(false)} onClick={onNext}>
        Get Started
      </button>
    </>
  );
}

// ─── Step 2: Create Admin Account ────────────────────────────────────────────

function Step2({ onNext }) {
  const [form, setForm] = useState({ display_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = form.display_name && form.email && form.password && form.confirm;

  async function handleSubmit() {
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_BASE + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: form.display_name,
          email: form.email,
          password: form.password,
          role: 'admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }
      onNext(data.token, data.user);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <ProgressDots current={2} total={6} />
      <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '24px', marginTop: 0 }}>
        Create your admin account
      </h1>
      {error && <div style={s.errorBox}>{error}</div>}
      {[
        { key: 'display_name', label: 'Display Name', type: 'text', placeholder: 'Your name' },
        { key: 'email', label: 'Email', type: 'email', placeholder: 'admin@example.com' },
        { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
        { key: 'confirm', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
      ].map(({ key, label, type, placeholder }) => (
        <div key={key} style={s.fieldWrap}>
          <label style={s.label}>{label}</label>
          <input
            type={type}
            placeholder={placeholder}
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={s.input}
          />
        </div>
      ))}
      <button style={s.primaryBtn(!valid || loading)} disabled={!valid || loading} onClick={handleSubmit}>
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
    </>
  );
}

// ─── Step 3: Media Storage ────────────────────────────────────────────────────

function Step3({ onNext }) {
  const [paths, setPaths] = useState([{ value: '', status: null, error: '' }]);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  function updatePath(i, val) {
    setPaths(prev => prev.map((p, idx) =>
      idx === i ? { value: val, status: null, error: '' } : p
    ));
  }

  function addPath() {
    setPaths(prev => [...prev, { value: '', status: null, error: '' }]);
  }

  function removePath(i) {
    setPaths(prev => prev.filter((_, idx) => idx !== i));
  }

  async function validate() {
    const filled = paths.filter(p => p.value.trim());
    if (!filled.length) return;
    setValidating(true);
    try {
      const res = await fetch(API_BASE + '/api/setup/validate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: filled.map(p => p.value.trim()) }),
      });
      const data = await res.json();
      const resultMap = {};
      data.results.forEach(r => { resultMap[r.path] = r; });
      setPaths(prev => prev.map(p => {
        const r = resultMap[p.value.trim()];
        if (!r) return p;
        return { ...p, status: r.valid ? 'ok' : 'err', error: r.error || '' };
      }));
    } catch {
      // network error — leave state as-is
    }
    setValidating(false);
  }

  const anyFilled = paths.some(p => p.value.trim());
  const allValidated = paths.every(p => !p.value.trim() || p.status === 'ok');
  const canNext = anyFilled && allValidated;

  async function handleNext() {
    setSaving(true);
    const validPaths = paths.filter(p => p.status === 'ok').map(p => p.value.trim());
    await fetch(API_BASE + '/api/setup/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_paths: JSON.stringify(validPaths) }),
    });
    setSaving(false);
    onNext();
  }

  return (
    <>
      <ProgressDots current={3} total={6} />
      <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '8px', marginTop: 0 }}>
        Where is your media?
      </h1>
      <p style={{ color: '#b3b3b3', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>
        Add every folder where your movies and TV shows are stored.
      </p>

      {paths.map((p, i) => (
        <div key={i} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="/mnt/nas/media"
              value={p.value}
              onChange={e => updatePath(i, e.target.value)}
              style={{ ...s.input, flex: 1 }}
            />
            {(paths.length > 1) && (
              <button onClick={() => removePath(i)} style={{
                background: 'none', border: 'none', color: '#666',
                fontSize: '20px', cursor: 'pointer', padding: '0 4px', lineHeight: 1,
              }}>×</button>
            )}
          </div>
          {p.status === 'ok' && <div style={s.successInline}>✓ Path found</div>}
          {p.status === 'err' && <div style={s.errorInline}>✗ {p.error}</div>}
        </div>
      ))}

      <button onClick={addPath} style={{
        background: 'none', border: 'none', color: '#1d4ed8',
        fontSize: '14px', cursor: 'pointer', padding: '4px 0', marginBottom: '20px',
      }}>
        + Add another location
      </button>

      <button
        style={s.secondaryBtn(!anyFilled || validating)}
        disabled={!anyFilled || validating}
        onClick={validate}
      >
        {validating ? 'Validating…' : 'Validate Paths'}
      </button>
      <button style={s.primaryBtn(!canNext || saving)} disabled={!canNext || saving} onClick={handleNext}>
        {saving ? 'Saving…' : 'Next'}
      </button>
    </>
  );
}

// ─── Shared Connector Step ───────────────────────────────────────────────────

function ArrStep({ step, headline, subtext, urlPlaceholder, service, urlKey, keyKey, usernameKey, passwordKey, onNext, onSkip }) {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  function resetTest() { setStatus(null); setErrMsg(''); }

  async function test() {
    setTesting(true);
    setStatus(null);
    setErrMsg('');
    try {
      const res = await fetch(API_BASE + '/api/setup/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usernameKey ? { type: service, url, username, password } : { type: service, url, apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('ok');
      } else {
        setStatus('err');
        setErrMsg(data.error || 'Connection failed.');
      }
    } catch {
      setStatus('err');
      setErrMsg('Network error.');
    }
    setTesting(false);
  }

  async function handleNext() {
    setSaving(true);
    await fetch(API_BASE + '/api/setup/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usernameKey ? { [urlKey]: url, [usernameKey]: username, [passwordKey]: password } : { [urlKey]: url, [keyKey]: apiKey }),
    });
    setSaving(false);
    onNext();
  }

  const canNext = status === 'ok';

  return (
    <>
      <ProgressDots current={step} total={6} />
      <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '8px', marginTop: 0 }}>
        {headline}
      </h1>
      <p style={{ color: '#b3b3b3', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>
        {subtext}
      </p>

      <div style={s.fieldWrap}>
        <label style={s.label}>{headline.replace('Connect ', '')} URL</label>
        <input
          type="text"
          placeholder={urlPlaceholder}
          value={url}
          onChange={e => { setUrl(e.target.value); resetTest(); }}
          style={s.input}
        />
      </div>

      <div style={s.fieldWrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ ...s.label, marginBottom: 0 }}>API Key</label>
          {url && (
            
              <a
              href={`${url}/settings/general`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#1d4ed8', fontSize: '12px', textDecoration: 'none' }}
            >
              Find your API key →
            </a>
          )}
        </div>
        <input
          type="text"
          placeholder="Paste your API key"
          value={apiKey}
          onChange={e => { setApiKey(e.target.value); resetTest(); }}
          style={s.input}
        />
      </div>

      {status === 'ok' && <div style={{ ...s.successInline, marginBottom: '12px' }}>✓ Connection successful</div>}
      {status === 'err' && <div style={{ ...s.errorInline, marginBottom: '12px' }}>✗ {errMsg}</div>}

      <button
        style={s.secondaryBtn(!url || !apiKey || testing)}
        disabled={usernameKey ? (!url || !username || !password || testing) : (!url || !apiKey || testing)}
        onClick={test}
      >
        {testing ? 'Testing…' : 'Test Connection'}
      </button>
      <button style={s.primaryBtn(!canNext || saving)} disabled={!canNext || saving} onClick={handleNext}>
        {saving ? 'Saving…' : 'Next'}
      </button>
      <button style={s.skipBtn} onClick={onSkip}>Skip for now</button>
    </>
  );
}

// ─── Step 6: Done ─────────────────────────────────────────────────────────────

function StepDone({ jwt, wizardUser }) {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(API_BASE + '/api/setup/complete', { method: 'POST' })
      .then(() => setDone(true))
      .catch(() => setDone(true));
  }, []);

  function launch() {
    if (jwt) localStorage.setItem('cinestack_token', jwt);
    if (jwt) localStorage.setItem('cinestack_user', JSON.stringify(wizardUser));
    window.location.href = '/app';
  }

  return (
    <>
      <ProgressDots current={6} total={6} />
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{
          width: '64px', height: '64px', background: '#27ae6020',
          border: '2px solid #27ae60', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <span style={{ color: '#27ae60', fontSize: '28px' }}>✓</span>
        </div>
        <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '700', marginBottom: '12px', marginTop: 0 }}>
          You're all set.
        </h1>
        <p style={{ color: '#b3b3b3', fontSize: '16px', marginBottom: '32px', lineHeight: '1.5' }}>
          CineStack is ready to go.
        </p>
      </div>
      <button style={s.primaryBtn(!done)} disabled={!done} onClick={launch}>
        Go to CineStack
      </button>
    </>
  );
}

// ─── Root Setup Component ─────────────────────────────────────────────────────

export default function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [jwt, setJwt] = useState(null);
  const [wizardUser, setWizardUser] = useState(null);

  useEffect(() => {
    fetch(API_BASE + '/api/setup/status')
      .then(r => r.json())
      .then(data => {
        if (data.complete) navigate('/app', { replace: true });
      })
      .catch(() => {});
  }, []);

  return (
    <Card>
      {step === 1 && <Step1 onNext={() => setStep(2)} />}
      {step === 2 && <Step2 onNext={(token, user) => { setJwt(token); setWizardUser(user); setStep(3); }} />}
      {step === 3 && <Step3 onNext={() => setStep(4)} />}
      {step === 4 && (
        <ArrStep
          step={4}
          headline="Connect Prowlarr"
          subtext="Prowlarr powers search in the Requests tab. Skip if you haven't set it up yet."
          urlPlaceholder="http://localhost:9696"
          service="prowlarr"
          urlKey="prowlarr_url"
          keyKey="prowlarr_api_key"
          onNext={() => setStep(5)}
          onSkip={() => setStep(5)}
        />
      )}
      {step === 5 && (
        <ArrStep
          step={5}
          headline="Connect Download Agent"
          subtext="Your seedbox or qBittorrent instance — this powers the Downloads tab. Skip if not set up yet."
          urlPlaceholder="http://localhost:8080"
          service="qbittorrent"
          urlKey="download_agent_url"
          usernameKey="download_agent_username"
          passwordKey="download_agent_password"
          onNext={() => setStep(6)}
          onSkip={() => setStep(6)}
        />
      )}
      {step === 6 && <StepDone jwt={jwt} wizardUser={wizardUser} />}
    </Card>
  );
}
