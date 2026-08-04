import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../api';

export default function Header() {
  const { data } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const passRate  = data?.pass_rate_pct;
  const avgScore  = data?.avg_score_pass_runs;
  const reg       = data?.regression;
  const isReg     = reg?.status === 'REGRESSION';

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 36px',
      height: 64,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            fontSize: 18, fontWeight: 800, letterSpacing: 5,
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.5))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            GUARDIAN
          </div>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 1 }}>
            AI Quality Command Center
          </div>
        </div>
      </div>

      {/* Right side stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Pass Rate */}
        {passRate != null && (
          <Stat
            value={`${passRate.toFixed(0)}%`}
            label="Pass Rate"
            color={passRate >= 70 ? 'var(--green)' : passRate >= 50 ? 'var(--amber)' : 'var(--red)'}
          />
        )}

        {/* Avg Score */}
        {avgScore != null && (
          <Stat
            value={avgScore.toFixed(2)}
            label="Avg Score"
            color="var(--blue)"
          />
        )}

        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }} />

        {/* Regression pill */}
        {reg && (
          <div style={{
            padding: '4px 12px', borderRadius: 20,
            fontSize: 11.5, fontWeight: 600,
            background: isReg ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            color: isReg ? 'var(--amber)' : 'var(--green)',
            border: `1px solid ${isReg ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
          }}>
          </div>
        )}

        {/* Live dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-up)' }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 8px var(--green)',
            animation: 'blink 2s ease-in-out infinite',
          }} />
          Live
        </div>
      </div>
    </header>
  );
}

function Stat({ value, label, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</span>
    </div>
  );
}
