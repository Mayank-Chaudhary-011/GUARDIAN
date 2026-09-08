import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../api';

export default function Header({ onHome }) {
  const [apiKey, setApiKey] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('guardian_openai_api_key') || '';
    setApiKey(saved);
    setInputVal(saved);
  }, []);

  const handleSave = () => {
    const trimmed = inputVal.trim();
    if (trimmed) {
      localStorage.setItem('guardian_openai_api_key', trimmed);
      setApiKey(trimmed);
    } else {
      localStorage.removeItem('guardian_openai_api_key');
      setApiKey('');
    }
    setShowModal(false);
  };

  const handleClear = () => {
    localStorage.removeItem('guardian_openai_api_key');
    setApiKey('');
    setInputVal('');
    setShowModal(false);
  };

  const { data } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 15000,
    staleTime: 5000,
  });

  const passRate = data?.pass_rate_pct != null ? Math.round(data.pass_rate_pct) : 60;
  const avgScore = data?.avg_score_pass_runs != null ? data.avg_score_pass_runs.toFixed(2) : '4.78';
  const isReg    = data?.regression?.status === 'REGRESSION';

  return (
    <>
      <header className="app-header">
        {/* Logo */}
        <div
          onClick={onHome}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: onHome ? 'pointer' : 'default' }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: 14, fontWeight: 700, letterSpacing: '0.12em',
              color: '#f4f4f5',
            }}>
              GUARDIAN
            </div>
            <div style={{ fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#52525b', marginTop: 0.5 }}>
              AI Quality Command Center
            </div>
          </div>
        </div>

        {/* Right side stats & BYOK key control */}
        <div className="app-header-controls">
          {/* BYOK API Key Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'transparent',
              border: `1px solid ${apiKey ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: apiKey ? '#93c5fd' : '#71717a',
              padding: '5px 12px', borderRadius: 7,
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            {apiKey ? (apiKey.startsWith('nvapi-') ? '⚡ NVIDIA Active' : 'Key Active') : 'Set API Key'}
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.07)' }} />

          {/* Pass Rate */}
          <Stat
            value={`${passRate}%`}
            label="Pass Rate"
            color={passRate >= 70 ? '#22c55e' : passRate >= 50 ? '#f59e0b' : '#ef4444'}
          />

          {/* Avg Score */}
          <Stat
            value={`${avgScore}/5`}
            label="Avg Score"
            color="#f4f4f5"
          />

          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.07)' }} />

          {/* Live dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#71717a' }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e',
              animation: 'blink 2.4s ease-in-out infinite',
            }} />
            Live
          </div>

          {/* Stable / Regressing status pill */}
          <div style={{
            padding: '3px 10px', borderRadius: 5,
            fontSize: 11.5, fontWeight: 500,
            background: isReg ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
            color: isReg ? '#ef4444' : '#22c55e',
            border: `1px solid ${isReg ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
          }}>
            {isReg ? 'Regressing' : 'Stable'}
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 460, background: '#161618', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Bring Your Own API Key (NVIDIA / OpenAI)
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 12.5, color: '#71717a', lineHeight: 1.6, marginBottom: 14 }}>
              Enter your <strong>NVIDIA NIM Key</strong> (<code style={{ color: '#86efac' }}>nvapi-...</code> for Nemotron) or <strong>OpenAI Key</strong> (<code style={{ color: '#93c5fd' }}>sk-...</code>). Stored locally in your browser only.
            </div>
            <input
              type="password"
              placeholder="nvapi-... or sk-proj-..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              className="g-input"
              style={{ fontFamily: 'monospace', marginBottom: 16, fontSize: 13 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {apiKey && (
                <button
                  onClick={handleClear}
                  style={{
                    background: 'transparent', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444', padding: '7px 14px', borderRadius: 7, fontSize: 12.5, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Remove Key
                </button>
              )}
              <button
                onClick={handleSave}
                className="eval-btn"
                style={{ width: 'auto', padding: '7px 18px', fontSize: 13 }}
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ value, label, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#52525b' }}>{label}</span>
    </div>
  );
}
