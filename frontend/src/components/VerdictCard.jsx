import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const CIRC = 207; // 2πr where r=33

function ScoreRing({ score, color, label, delay = 0 }) {
  const arcRef  = useRef(null);
  const numRef  = useRef(null);
  const prevRef = useRef(null);

  useEffect(() => {
    if (!arcRef.current || score == null) return;
    const offset = CIRC - (score / 5) * CIRC;
    gsap.to(arcRef.current, { strokeDashoffset: offset, stroke: color, duration: 1.1, ease: 'power3.out', delay });
    if (numRef.current) gsap.to(numRef.current, { color, duration: 0.4, delay });
    prevRef.current = score;
  }, [score]);

  return (
    <div className="ctile scored">
      <div className="ring-wrap">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle className="rbg" cx="40" cy="40" r="33" />
          <circle
            ref={arcRef}
            className="rarc"
            cx="40" cy="40" r="33"
            stroke={color}
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC}
          />
        </svg>
        <div className="ring-center">
          <span ref={numRef} className="rnum" style={{ color: '#2d3748' }}>
            {score ?? '—'}
          </span>
          <span className="rdenom">/5</span>
        </div>
      </div>
      <span className="ctag">{label}</span>
    </div>
  );
}

export default function VerdictCard({ result }) {
  const wrapRef = useRef(null);
  const barRef  = useRef(null);

  useEffect(() => {
    if (!result || !wrapRef.current) return;
    gsap.fromTo(wrapRef.current,
      { y: 14, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.45, ease: 'power2.out' }
    );
    if (barRef.current) {
      gsap.fromTo(barRef.current,
        { width: '0%' },
        { width: `${(result.confidence * 100).toFixed(0)}%`, duration: 1.1, ease: 'power3.out', delay: 0.2 }
      );
    }
  }, [result]);

  if (!result) {
    return (
      <div className="vblock">
        <div className="v-idle">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p>Run evaluation to see GUARDIAN's verdict</p>
        </div>
      </div>
    );
  }

  const isPass = result.final_verdict === 'PASS';
  const cls = isPass ? 'pass' : 'fail';

  return (
    <div ref={wrapRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Verdict header */}
      <div className={`vblock ${cls}`}>
        <div className="v-result">
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className={`v-word ${cls}`}>{result.final_verdict}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <span className="qtag">{result.question_type}</span>
                {result.provider && (
                  <span className="qtag" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.3)' }}>
                    ⚡ {result.provider}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="v-fscore" style={{ color: isPass ? 'var(--green)' : 'var(--red)' }}>
                {result.final_score.toFixed(2)}
              </div>
              <div className="v-fmax">out of 5.0</div>
            </div>
          </div>

          {/* Confidence bar */}
          <div>
            <div className="conf-lbs" style={{ marginBottom: 6 }}>
              <span>Confidence</span>
              <span style={{ fontWeight: 600 }}>{Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="conf-track">
              <div ref={barRef} className={`conf-bar ${cls}`} />
            </div>
          </div>

          {/* Reasoning */}
          {result.reasoning && (
            <div className="reasoning-text">"{result.reasoning}"</div>
          )}

          {/* Issues */}
          {result.issues?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.issues.map((issue, i) => (
                <div key={i} className="issue-row">
                  <span className="iarrow">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </span>
                  {issue}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Critic score rings */}
      <div className="critics-row">
        <ScoreRing score={result.accuracy_score}     color="#3b82f6" label="Accuracy"     delay={0} />
        <ScoreRing score={result.relevance_score}    color="#8b5cf6" label="Relevance"    delay={0.08} />
        <ScoreRing score={result.completeness_score} color="#10b981" label="Completeness" delay={0.16} />
      </div>
    </div>
  );
}
