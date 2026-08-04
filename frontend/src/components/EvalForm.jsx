import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { runEval, improveOutput, improvePrompt } from '../api';
import VerdictCard from './VerdictCard';
import Pipeline from './Pipeline';
import MetricsRow from './MetricsRow';

const PIPELINE_STEPS = ['input', 'accuracy', 'relevance', 'complete', 'adjudicator', 'verdict'];

/* ── Sample presets ── */
const SAMPLES = [
  {
    input: 'How do I fix an asyncio connection reset error in Python?',
    output: 'An asyncio connection reset usually means the remote end closed the connection unexpectedly. To fix it: (1) Wrap your coroutine in a try/except for asyncio.IncompleteReadError and ConnectionResetError. (2) Add a reconnect loop with exponential backoff using asyncio.sleep. (3) Check if the server has a keep-alive timeout — set SO_KEEPALIVE on the socket. (4) If using aiohttp, use connector=aiohttp.TCPConnector(keepalive_timeout=30). This covers 95% of production cases.'
  },
  {
    input: 'Compare Redis vs PostgreSQL for session caching in a high-traffic API',
    output: 'Redis wins for pure session caching: sub-millisecond reads, built-in TTL, and horizontal scaling via Redis Cluster. PostgreSQL can handle it but adds query overhead and lacks native TTL — you need a cron job to purge expired rows. For 10k+ RPS, Redis is the clear choice. Use Postgres only if you need ACID guarantees on session data or already have it in your stack and traffic is moderate (<1k RPS).'
  },
  {
    input: 'Explain the Python GIL and when it causes real performance problems',
    output: 'The GIL (Global Interpreter Lock) prevents multiple native threads from executing Python bytecode simultaneously. It causes real problems in CPU-bound workloads — e.g., image processing or ML inference in pure Python — because threads cannot run in parallel. It does NOT hurt I/O-bound code (network, disk) because the GIL is released during I/O waits. Solutions: use multiprocessing for CPU tasks, or libraries like NumPy that release the GIL internally.'
  },
  {
    input: 'What are the best practices for securing a REST API?',
    output: 'Key REST API security practices: (1) Always use HTTPS — never plain HTTP. (2) Authenticate with short-lived JWTs (15-min access, 7-day refresh). (3) Validate and sanitize all input — never trust client data. (4) Rate-limit endpoints (e.g., 100 req/min per IP). (5) Use CORS allowlists, not wildcards. (6) Never expose stack traces in error responses. (7) Log all auth failures and alert on anomalies. (8) Use RBAC for authorization — least privilege always.'
  },
];

let sampleIdx = 0;

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
    if (!input.trim()) return;
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

  const loadSample = () => {
    const s = SAMPLES[sampleIdx % SAMPLES.length];
    sampleIdx++;
    setInput(s.input);
    setOutput(s.output);
    setResult(null); setError(null);
    setImprovedOut(null); setImprovedPrompt(null);
    setPassedNodes([]); setActiveNode(null);
  };

  const useImprovedPrompt = () => {
    if (improvedPrompt) { setInput(improvedPrompt); setImprovedPrompt(null); }
  };

  return (
    <div ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Two-column main section (stacks on mobile) ── */}
      <div className="eval-grid">

        {/* ── LEFT: Input Panel ── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div className="sec-label" style={{ marginBottom: 0 }}>Evaluate AI Output</div>
            <button className="clear-btn" onClick={loadSample} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Load Sample
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Prompt textarea + Rewrite header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <label style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--muted-up)' }}>
                  Question / Prompt
                </label>
                {input.trim() && !improvedPrompt && (
                  <button
                    onClick={handleImprovePrompt}
                    disabled={improvingPrompt}
                    style={{
                      background: 'none', border: 'none', color: '#a78bfa',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    {improvingPrompt ? 'Rewriting Question…' : 'Optimize Question'}
                  </button>
                )}
              </div>
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

            {/* Improved Prompt result */}
            {improvedPrompt && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Optimized Prompt (High Clarity)
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
                  Use this prompt as question
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

          {/* Improve Output — ALWAYS visible after ANY evaluation result */}
          {result && !improvedOut && (
            <button className="improve-btn" disabled={improvingOut} onClick={handleImproveOutput}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 11 19-9-9 19-2-8-8-2z"/>
              </svg>
              {improvingOut ? 'Optimizing AI Response with AI…' : 'Optimize AI Response & Token Cost'}
            </button>
          )}

          {/* Improved Output result */}
          {improvedOut && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  ✓ Token-Optimized AI Output
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

      {/* ── Recent Evaluations ── */}
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
