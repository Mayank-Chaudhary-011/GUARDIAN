import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

function deriveMetrics(result) {
  const scores = [
    result.accuracy_score,
    result.relevance_score,
    result.completeness_score,
  ].filter(s => s != null);

  if (!scores.length) return null;

  const total = scores.length;
  const tp = scores.filter(s => s >= 4).length;
  const fn = scores.filter(s => s < 3).length;

  const precision     = total > 0 ? tp / total : 0;
  const recall        = (tp + fn) > 0 ? tp / (tp + fn) : 1;
  const f1            = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const avgScore      = scores.reduce((a, b) => a + b, 0) / total;
  const regressionRisk = Math.max(0, (3.0 - avgScore) / 3.0);

  return {
    precision:      Math.round(precision * 100),
    recall:         Math.round(recall    * 100),
    f1:             Math.round(f1        * 100),
    avgScore:       avgScore.toFixed(2),
    regressionRisk: Math.round(regressionRisk * 100),
    tokensEst:      result.tokens_est || 0,
    tokensSaved:    result.tokens_saved || 0,
  };
}

function MetricTile({ value, pct, label, color, sublabel, delay = 0 }) {
  const barRef = useRef(null);
  const valRef = useRef(null);

  useEffect(() => {
    if (barRef.current) {
      gsap.fromTo(barRef.current,
        { width: '0%' },
        { width: `${pct}%`, duration: 1.1, ease: 'power3.out', delay }
      );
    }
    if (valRef.current) {
      gsap.fromTo(valRef.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay }
      );
    }
  }, [pct]);

  return (
    <div className="metric-tile">
      <div ref={valRef} className="metric-val" style={{ color }}>
        {typeof value === 'string' ? value : `${value}%`}
      </div>
      <div className="metric-sub">{label}</div>
      <div className="metric-bar-track">
        <div
          ref={barRef}
          className="metric-bar"
          style={{ background: color, width: '0%' }}
        />
      </div>
      {sublabel && (
        <div style={{ fontSize: 10, color: 'var(--muted-up)', marginTop: 4 }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

export default function MetricsRow({ result }) {
  const wrapRef = useRef(null);
  const m = deriveMetrics(result);

  useEffect(() => {
    if (wrapRef.current) {
      gsap.fromTo(wrapRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [result]);

  if (!m) return null;

  const riskColor = m.regressionRisk > 50 ? '#f43f5e' : m.regressionRisk > 25 ? '#fbbf24' : '#10b981';

  return (
    <div ref={wrapRef} className="card" style={{ padding: '20px 24px' }}>
      <div className="sec-label">Quality & Token Metrics</div>
      <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <MetricTile
          value={m.precision} pct={m.precision} label="Precision"
          color="#3b82f6" delay={0}
        />
        <MetricTile
          value={m.recall} pct={m.recall} label="Recall"
          color="#a78bfa" delay={0.07}
        />
        <MetricTile
          value={m.f1} pct={m.f1} label="F1 Score"
          color="#22d3ee" delay={0.14}
        />
        <MetricTile
          value={`${m.tokensEst}`} pct={Math.min(100, Math.round((m.tokensEst / 500) * 100))}
          label="Est. Tokens" color="#fbbf24"
          sublabel={m.tokensSaved > 0 ? `Saved ${m.tokensSaved} tokens` : 'Smart-Optimized'}
          delay={0.21}
        />
        <MetricTile
          value={`${m.regressionRisk}%`} pct={m.regressionRisk} label="Regression Risk"
          color={riskColor} delay={0.28}
        />
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted-up)', lineHeight: 1.6 }}>
        Derived from critic scores · Tokens estimated via ~4 chars/token · 80% proxy tokens saved via 1-in-5 smart sampling
      </div>
    </div>
  );
}
