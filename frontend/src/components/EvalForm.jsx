import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { runEval, improveOutput, improvePrompt } from '../api';
import VerdictCard from './VerdictCard';
import Pipeline from './Pipeline';
import MetricsRow from './MetricsRow';

const PIPELINE_STEPS = ['input', 'accuracy', 'relevance', 'complete', 'adjudicator', 'verdict'];

export default function EvalForm() {
  const [input,    setInput]    = useState('');
  const [output,   setOutput]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const [history,  setHistory]  = useState([]);

  // Improve Output
  const [improvingOut, setImprovingOut] = useState(false);
  const [improvedOut,  setImprovedOut]  = useState(null);

  // Improve Prompt
  const [improvingPrompt, setImprovingPrompt] = useState(false);
  const [improvedPrompt,  setImprovedPrompt]  = useState(null);

  const [activeNode,  setActiveNode]  = useState(null);
  const [passedNodes, setPassedNodes] = useState([]);

  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { y: 20, opacity: 0 },
        { y: 0,  opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  const animatePipeline = async () => {
    for (const node of PIPELINE_STEPS) {
      setActiveNode(node);
      await new Promise(r => setTimeout(r, 220));
      setPassedNodes(prev => [...prev, node]);
      setActiveNode(null);
      await new Promise(r => setTimeout(r, 60));
    }
  };

  const handleEval = async () => {
    if (!input.trim() || !output.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setImprovedOut(null);
    setImprovedPrompt(null);
    setPassedNodes([]);
    setActiveNode('input');
    try {
      const data = await runEval(input, output);
      await animatePipeline();
      setResult(data);
      setHistory(prev => [{
        id: Date.now(),
        prompt: input,
        result: data,
        time: 'just now'
      }, ...prev].slice(0, 6));
    } catch (err) {
      const detail = err?.detail ?? err;
      if (typeof detail === 'object' && detail.reason) {
        setError(detail.reason);
        setPassedNodes(['input', 'blocked']);
      } else {
        setError(typeof detail === 'string' ? detail : 'Evaluation failed. Make sure the backend is running.');
      }
      setActiveNode(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImproveOutput = async () => {
    setImprovingOut(true);
    try {
      const data = await improveOutput(input, output, result?.issues ?? []);
      setImprovedOut(data);
    } catch (e) {
      alert('Improve output failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setImprovingOut(false);
    }
  };

  const handleImprovePrompt = async () => {
    setImprovingPrompt(true);
    try {
      const rewritten = await improvePrompt(input, result?.issues ?? []);
      setImprovedPrompt(rewritten);
    } catch (e) {
      alert('Improve prompt failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setImprovingPrompt(false);
    }
  };

  const handleClear = () => {
    setInput(''); setOutput(''); setResult(null); setError(null);
    setImprovedOut(null); setImprovedPrompt(null);
    setPassedNodes([]); setActiveNode(null);
  };

  const useImprovedPrompt = () => {
    if (improvedPrompt) { setInput(improvedPrompt); setImprovedPrompt(null); }
  };

  const isFail = result?.final_verdict === 'FAIL';

  return (
    <div ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Two-column main section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: Input Panel ── */}
        <div className="card">
          <div className="sec-label">Evaluate AI Output</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Prompt textarea */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--muted-up)', marginBottom: 7 }}>
                Question / Prompt
              </label>
              <textarea
                id="prompt-input"
                rows={4}
                style={{ minHeight: 95 }}
                placeholder="Enter the user's question or prompt that was sent to the AI..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </div>

            {/* AI Output textarea */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--muted-up)', marginBottom: 7 }}>
                AI Output to Evaluate
              </label>
              <textarea
                id="output-input"
                rows={6}
                style={{ minHeight: 130 }}
                placeholder="Paste the AI model's response here..."
                value={output}
                onChange={e => setOutput(e.target.value)}
              />
            </div>

            {/* Error banner */}
            {error && (
              <div className="err-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="clear-btn" onClick={handleClear}>Clear</button>
              <button
                id="run-eval-btn"
                className="eval-btn"
                style={{ flex: 1 }}
                disabled={loading || !input.trim() || !output.trim()}
                onClick={handleEval}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 14, height: 14,
                      border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff',
                      borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
                    }} />
                    Evaluating…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Run Evaluation
                  </>
                )}
              </button>
            </div>

            {/* Improve Prompt — visible after FAIL */}
            {isFail && !improvedPrompt && (
              <button className="prompt-btn" disabled={improvingPrompt} onClick={handleImprovePrompt}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                {improvingPrompt ? 'Rewriting prompt…' : 'Improve the Prompt (Rewrite Question)'}
              </button>
            )}

            {/* Improved Prompt result */}
            {improvedPrompt && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Improved Prompt
                </div>
                <div className="improved-block prompt">
                  {improvedPrompt}
                </div>
                <button
                  className="prompt-btn"
                  onClick={useImprovedPrompt}
                  style={{ marginTop: 2 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  Use this prompt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px 0' }}>
              <div className="sec-label">Critic Scores & Verdict</div>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <VerdictCard result={result} />
            </div>
          </div>

          {/* Improve Output — visible after FAIL */}
          {isFail && !improvedOut && (
            <button className="improve-btn" disabled={improvingOut} onClick={handleImproveOutput}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 11 19-9-9 19-2-8-8-2z"/>
              </svg>
              {improvingOut ? 'Improving with AI…' : 'Improve AI Output'}
            </button>
          )}

          {/* Improved Output result */}
          {improvedOut && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  ✓ Improved Output
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', padding: '3px 10px', borderRadius: 12, border: '1px solid rgba(59,130,246,0.25)' }}>
                  ⚡ {improvedOut.new_tokens || 0} tokens {improvedOut.tokens_saved > 0 ? `(Saved ${improvedOut.tokens_saved} tok)` : '(Token-Optimized)'}
                </div>
              </div>
              <div className="improved-block output" style={{ marginBottom: 12 }}>
                {improvedOut.improved_output}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--green)', fontWeight: 600 }}>
                New verdict: {improvedOut.eval_result.final_verdict} — {improvedOut.eval_result.final_score.toFixed(2)}/5.0
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Evaluation Pipeline ── */}
      <Pipeline activeNode={activeNode} passedNodes={passedNodes} result={result} />

      {/* Metrics — shown after a result */}
      {result && <MetricsRow result={result} />}

      {/* ── Recent Evaluations (Matching Screenshot 1) ── */}
      {history.length > 0 && (
        <div className="card">
          <div className="sec-label">Recent Evaluations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {history.map(item => {
              const isPass = item.result.final_verdict === 'PASS';
              const color  = isPass ? '#10b981' : '#f43f5e';
              return (
                <div key={item.id} style={{
                  background: '#000000',
                  border: `1px solid ${isPass ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
                  borderRadius: 10, padding: 14,
                  display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`badge ${isPass ? 'badge-pass' : 'badge-fail'}`}>
                      {item.result.final_verdict}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                      {item.result.final_score.toFixed(2)}/5
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12, color: 'var(--text-dim)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {item.prompt}
                  </p>
                  {/* Mini score bars ACC | REL | COM */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${(item.result.accuracy_score / 5) * 100}%`, height: '100%', background: '#3b82f6' }} />
                    </div>
                    <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${(item.result.relevance_score / 5) * 100}%`, height: '100%', background: '#8b5cf6' }} />
                    </div>
                    <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${(item.result.completeness_score / 5) * 100}%`, height: '100%', background: '#10b981' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--muted-up)' }}>
                    <span>ACC / REL / COM</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
