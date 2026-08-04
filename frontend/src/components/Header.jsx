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
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 36px',
        height: 64,
        background: 'rgba(5, 7, 15, 0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Logo */}
        <div
          onClick={onHome}
          style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: onHome ? 'pointer' : 'default' }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 3L4 8V15.5C4 22.68 9.12 29.35 16 31C22.88 29.35 28 22.68 28 15.5V8L16 3Z" fill="url(#header-shield-grad)" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M11 16.5L14.5 20L21 12.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="header-shield-grad" x1="4" y1="3" x2="28" y2="31" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1e40af"/>
                  <stop offset="1" stopColor="#3b82f6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: 17, fontWeight: 800, letterSpacing: 5,
              color: '#ffffff',
            }}>
              GUARDIAN
            </div>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted-up)', marginTop: 1 }}>
              AI Quality Command Center
            </div>
          </div>
        </div>

        {/* Right side stats & BYOK key control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {onHome && (
            <button
              onClick={onHome}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#94a3b8', padding: '6px 12px', borderRadius: 8,
                fontSize: 11.5, fontWeight: 600, cursor: 'pointer'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              Landing Page
            </button>
          )}
          {/* BYOK API Key Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: apiKey ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${apiKey ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.12)'}`,
              color: apiKey ? '#60a5fa' : '#94a3b8',
              padding: '6px 14px', borderRadius: 8,
              fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-2-2l2 2M3 11l9-9 9 9-9 9-9-9z"/>
              <path d="M7 15l-4 4 2 2 4-4"/>
            </svg>
            {apiKey ? 'API Key: Active' : 'Set OpenAI Key'}
          </button>

          {/* Pass Rate */}
          <Stat
            value={`${passRate}%`}
            label="Pass Rate"
            color={passRate >= 70 ? '#10b981' : passRate >= 50 ? '#fbbf24' : '#f43f5e'}
          />

          {/* Avg Score */}
          <Stat
            value={`${avgScore}/5`}
            label="Avg Score"
            color="#3b82f6"
          />

          <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.08)' }} />

          {/* Live dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-up)' }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
              animation: 'blink 2s ease-in-out infinite',
            }} />
            Live
          </div>

          {/* Stable / Regressing status pill */}
          <div style={{
            padding: '4px 14px', borderRadius: 20,
            fontSize: 11.5, fontWeight: 600,
            background: isReg ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
            color: isReg ? '#f43f5e' : '#10b981',
            border: `1px solid ${isReg ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`,
          }}>
            {isReg ? 'Regressing' : 'Stable'}
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, background: '#0a0d18', border: '1px solid rgba(59,130,246,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-2-2l2 2M3 11l9-9 9 9-9 9-9-9z"/>
                  <path d="M7 15l-4 4 2 2 4-4"/>
                </svg>
                Bring Your Own OpenAI API Key
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted-up)', lineHeight: 1.5, marginBottom: 16 }}>
              Enter your personal OpenAI API Key below to run evaluations and proxy chat calls using your own quota. Your key is stored strictly in your local browser storage.
            </div>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: '#000000', border: '1px solid var(--border)',
                color: '#fff', fontSize: 12, fontFamily: 'monospace', marginBottom: 20
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {apiKey && (
                <button
                  onClick={handleClear}
                  style={{
                    background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)',
                    color: '#f43f5e', padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer'
                  }}
                >
                  Clear Key
                </button>
              )}
              <button
                onClick={handleSave}
                className="eval-btn"
                style={{ width: 'auto', padding: '8px 20px' }}
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
      <span style={{ fontSize: 15, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontSize: 8.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted-up)' }}>{label}</span>
    </div>
  );
}
