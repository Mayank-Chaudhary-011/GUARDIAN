import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, desc, delay }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { y: 24, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.5, delay: delay * 0.08,
        ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 90%' }
      }
    );
  }, []);
  return (
    <div ref={ref} style={{
      background: '#161618',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: 24,
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: 'rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#f4f4f5' }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: '#71717a', lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

/* ─── Stat Pill ─── */
function StatPill({ value, label }) {
  return (
    <div style={{
      background: '#161618',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '18px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#f4f4f5', lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#71717a', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function LandingPage({ onLaunch }) {
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.fromTo(titleRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
      .fromTo(subRef.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.3')
      .fromTo(ctaRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, '-=0.25')
      .fromTo(imgRef.current,
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        '-=0.1'
      );

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <div style={{ background: '#0a0a0a', color: '#f4f4f5', fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 56,
        background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.15em', color: '#f4f4f5' }}>GUARDIAN</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#features" style={{ color: '#71717a', fontSize: 13.5, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
            onMouseEnter={e => e.target.style.color = '#f4f4f5'}
            onMouseLeave={e => e.target.style.color = '#71717a'}
          >Features</a>
          <a href="#architecture" style={{ color: '#71717a', fontSize: 13.5, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
            onMouseEnter={e => e.target.style.color = '#f4f4f5'}
            onMouseLeave={e => e.target.style.color = '#71717a'}
          >Architecture</a>
          <a
            href="https://github.com/Mayank-Chaudhary-011/GAURDIAN"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#a1a1aa', fontSize: 13, textDecoration: 'none', fontWeight: 500,
              padding: '6px 12px', borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              transition: 'border-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <button onClick={onLaunch} className="eval-btn" style={{ padding: '7px 16px', fontSize: 13.5, borderRadius: 7 }}>
            Launch App
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        minHeight: '90vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Very subtle top border accent — not a glow, just a thin line */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 280, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <div ref={titleRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            border: '1px solid rgba(59,130,246,0.2)',
            background: 'rgba(59,130,246,0.06)',
            fontSize: 12, fontWeight: 500, color: '#93c5fd',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            LangGraph · FastAPI · React 18
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)', fontWeight: 700,
            letterSpacing: '-0.03em', lineHeight: 1.1,
            textAlign: 'center', maxWidth: 820,
            color: '#f4f4f5',
          }}>
            Evaluate, Secure &amp; Audit<br />Your LLMs in Production
          </h1>
        </div>

        {/* Sub */}
        <p ref={subRef} style={{
          fontSize: 'clamp(15px, 1.8vw, 18px)', color: '#71717a',
          maxWidth: 640, textAlign: 'center', lineHeight: 1.7,
          marginTop: 20, marginBottom: 36, fontWeight: 400,
        }}>
          GUARDIAN combines a <span style={{ color: '#a1a1aa', fontWeight: 500 }}>LangGraph multi-critic pipeline</span>,
          zero-token security guardrails, 1-in-5 smart sampling proxy routing,
          and an <span style={{ color: '#a1a1aa', fontWeight: 500 }}>MLOps model benchmark suite</span> into one command center.
        </p>

        {/* CTA Row */}
        <div ref={ctaRef} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
          <button onClick={onLaunch} className="eval-btn" style={{ padding: '11px 28px', fontSize: 14.5, borderRadius: 9, gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Launch Command Center
          </button>
          <a
            href="https://github.com/Mayank-Chaudhary-011/GAURDIAN"
            target="_blank" rel="noreferrer"
            className="clear-btn"
            style={{ padding: '11px 24px', fontSize: 14.5, borderRadius: 9, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            View Source
          </a>
        </div>

        {/* Dashboard Screenshot */}
        <div ref={imgRef} style={{ width: '100%', maxWidth: 980 }}>
          <div style={{
            background: '#111113', borderRadius: 12, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }}>
            {/* Browser chrome bar */}
            <div style={{
              padding: '8px 14px', background: '#0d0d0f',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 7
            }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3a3a3c' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3a3a3c' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3a3a3c' }} />
              <span style={{
                flex: 1, background: '#1a1a1e', borderRadius: 5, padding: '3px 10px',
                fontSize: 11, color: '#52525b', fontFamily: 'monospace', marginLeft: 8
              }}>
                guardian-ecru.vercel.app
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#22c55e', fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                Live
              </span>
            </div>
            <img
              src="/dashboard.png"
              alt="GUARDIAN Dashboard Screenshot"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section style={{ padding: '56px 24px', maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <StatPill value="~80%" label="Token Cost Reduction via Smart Sampling" />
          <StatPill value="<15ms" label="Security Pre-Check Latency" />
          <StatPill value="4 Models" label="MLOps Benchmark Suite" />
          <StatPill value="100%" label="Prompt Injection Protection" />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '56px 24px', maxWidth: 1040, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="sec-label" style={{ marginBottom: 6 }}>Capabilities</div>
        <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em', color: '#f4f4f5' }}>
          Engineered for Production LLM Stacks
        </h2>
        <p style={{ fontSize: 14, color: '#71717a', marginBottom: 36, maxWidth: 520, lineHeight: 1.65 }}>
          Every module is built with production-grade patterns — token budgets, security gates, and observability baked in.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <FeatureCard delay={0} icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          } title="LangGraph Multi-Critic Engine"
            desc="Accuracy, Relevance, and Completeness critics run through a StateGraph. An Adjudicator node weighs verdicts and returns a deterministic PASS / FAIL with reasoning." />
          <FeatureCard delay={1} icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          } title="Zero-Token Security Guard"
            desc="AST + regex pre-check fires in <15ms before any LLM call. Blocks 30+ prompt injection patterns, jailbreaks, DAN mode, and credential extraction attempts." />
          <FeatureCard delay={2} icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          } title="1-in-5 Smart Sampling Proxy"
            desc="Transparent OpenAI-compatible proxy evaluates 20% of traffic on a round-robin schedule. Suspicious short responses are always force-evaluated." />
          <FeatureCard delay={3} icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          } title="MLOps Dataset Audit Suite"
            desc="Upload any CSV. GUARDIAN trains Random Forest, Extra Trees, Logistic Regression, and Naive Bayes, then diagnoses underfitting vs. overfitting with F1, Precision, and Recall." />
          <FeatureCard delay={4} icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
          } title="Real-Time WebSocket Logs"
            desc="Proxy request logs stream live to your dashboard via WebSocket. Every evaluation, block, and passthrough event appears in under 100ms — no polling required." />
          <FeatureCard delay={5} icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          } title="Slack Block-Kit Alerts"
            desc="Regression detection compares rolling windows of pass rates. Drops below threshold trigger rich Slack notifications automatically after each evaluation cycle." />
        </div>
      </section>

      {/* ── Architecture Flow ── */}
      <section id="architecture" style={{ padding: '56px 24px', maxWidth: 1040, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="sec-label" style={{ marginBottom: 6 }}>System Design</div>
        <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, marginBottom: 36, letterSpacing: '-0.02em', color: '#f4f4f5' }}>
          How GUARDIAN Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {[
            { step: '01', label: 'Security Guard', sub: 'Regex + AST scan' },
            { step: '02', label: 'Preprocess', sub: 'Token optimization' },
            { step: '03', label: 'Accuracy Critic', sub: 'Factual scan' },
            { step: '04', label: 'Relevance Critic', sub: 'Intent alignment' },
            { step: '05', label: 'Completeness', sub: 'Coverage analysis' },
            { step: '06', label: 'Adjudicator', sub: 'Weighted verdict' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#161618',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: 16,
              borderTop: '2px solid rgba(59,130,246,0.3)',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.1em', marginBottom: 8 }}>{s.step}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f4f4f5', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11.5, color: '#52525b', lineHeight: 1.5 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section id="mlops" style={{ padding: '56px 24px', maxWidth: 1040, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="sec-label" style={{ marginBottom: 6 }}>Tech Stack</div>
        <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, marginBottom: 28, letterSpacing: '-0.02em', color: '#f4f4f5' }}>
          Built With Production-Grade Tools
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Python 3.11', 'FastAPI', 'LangGraph', 'LangChain', 'OpenAI API', 'Groq API', 'Scikit-Learn', 'TF-IDF', 'React 18', 'Vite', 'GSAP', 'WebSockets', 'Supabase', 'Render', 'Vercel'].map((t, i) => (
            <span key={i} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>{t}</span>
          ))}
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section style={{
        padding: '72px 24px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, marginBottom: 14, letterSpacing: '-0.02em', color: '#f4f4f5' }}>
          Ready to Guard Your LLM Pipeline?
        </h2>
        <p style={{ fontSize: 14.5, color: '#71717a', marginBottom: 32, maxWidth: 440, lineHeight: 1.65 }}>
          Launch the live command center. No sign-up required. Bring your own OpenAI key or run on Groq for free.
        </p>
        <button onClick={onLaunch} className="eval-btn" style={{ padding: '12px 36px', fontSize: 15, borderRadius: 9, gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Launch GUARDIAN
        </button>
        <div style={{ marginTop: 28, fontSize: 12, color: '#3f3f46' }}>
          Open Source · Free to use · Built with LangGraph + FastAPI + React 18
        </div>
      </section>

    </div>
  );
}
