import { useEffect, useRef, Fragment } from 'react';
import { gsap } from 'gsap';

const NODES = [
  {
    id: 'input', label: 'Input',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
      </svg>
    ),
  },
  {
    id: 'accuracy', label: 'Accuracy',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
  {
    id: 'relevance', label: 'Relevance',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    id: 'complete', label: 'Complete',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    id: 'adjudicator', label: 'Adjudicator',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M3 12h18"/>
        <circle cx="12" cy="12" r="9"/>
      </svg>
    ),
  },
  {
    id: 'verdict', label: 'Verdict',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
];

export default function Pipeline({ activeNode, passedNodes, result }) {
  const nodeRefs = useRef([]);

  useEffect(() => {
    const nodes = nodeRefs.current.filter(Boolean);
    gsap.set(nodes, { scale: 0.85, opacity: 0 });
    gsap.to(nodes, { scale: 1, opacity: 1, stagger: 0.05, duration: 0.35, ease: 'back.out(1.5)', delay: 0.05 });
  }, []);

  const getNodeScore = (id) => {
    if (!result) return null;
    if (id === 'accuracy')    return result.accuracy_score != null ? `${result.accuracy_score}/5` : null;
    if (id === 'relevance')   return result.relevance_score != null ? `${result.relevance_score}/5` : null;
    if (id === 'complete')    return result.completeness_score != null ? `${result.completeness_score}/5` : null;
    if (id === 'adjudicator') return result.final_score != null ? result.final_score.toFixed(1) : null;
    if (id === 'verdict')     return result.final_verdict || null;
    return null;
  };

  const isNodeGood = (id) => {
    if (!result) return true;
    if (id === 'accuracy')    return (result.accuracy_score ?? 0) >= 3;
    if (id === 'relevance')   return (result.relevance_score ?? 0) >= 3;
    if (id === 'complete')    return (result.completeness_score ?? 0) >= 3;
    if (id === 'adjudicator') return (result.final_score ?? 0) >= 3.0;
    if (id === 'verdict')     return result.final_verdict === 'PASS';
    return true;
  };

  return (
    <div className="card" style={{ marginBottom: 0, padding: '20px 28px 18px' }}>
      <div className="sec-label">Evaluation Pipeline</div>
      <div className="pipeline">
        {NODES.map((node, i) => {
          const isOk       = passedNodes.includes(node.id);
          const isActive   = activeNode === node.id;
          const isBad      = passedNodes.includes('blocked') && node.id !== 'input';
          const scoreText  = getNodeScore(node.id);
          const isGood     = isNodeGood(node.id);

          const connActive = i > 0 && isActive;
          const connDone   = i > 0 && isOk;

          let statusClass = '';
          if (isActive) statusClass = ' active';
          else if (isOk && !isBad) statusClass = isGood ? ' ok' : ' bad';
          else if (isBad) statusClass = ' bad';

          return (
            <Fragment key={node.id}>
              {i > 0 && (
                <div className={`conn${connActive ? ' active' : ''}${connDone ? ' done' : ''}`} />
              )}
              <div
                ref={el => nodeRefs.current[i] = el}
                className={`pnode${statusClass}`}
              >
                <div className="nring">{node.icon}</div>
                <span className="nname">{node.label}</span>
                {scoreText && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, marginTop: 2,
                    color: isGood ? 'var(--green)' : 'var(--red)',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {scoreText}
                  </span>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
