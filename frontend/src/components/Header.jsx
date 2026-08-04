import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../api';

export default function Header() {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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

      {/* Right side stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
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
