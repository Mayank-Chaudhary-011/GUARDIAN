import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─── Floating Particle Block ─── */
function FloatingBlock({ x, y, size, color, delay, duration, rotate = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.set(ref.current, { x, y, rotation: rotate, opacity: 0 });
    gsap.to(ref.current, {
      opacity: 1, duration: 1.2, delay, ease: 'power2.out'
    });
    gsap.to(ref.current, {
      y: y - 28,
      rotation: rotate + 12,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      delay,
    });
  }, []);
  return (
    <div ref={ref} style={{
      position: 'absolute', width: size, height: size,
      borderRadius: size * 0.22,
      background: `linear-gradient(135deg, ${color}22, ${color}08)`,
      border: `1px solid ${color}30`,
      backdropFilter: 'blur(4px)',
      boxShadow: `0 0 24px ${color}18, inset 0 1px 0 ${color}20`,
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, desc, color, delay }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, delay: delay * 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%' }
      }
    );
  }, []);
  return (
    <div ref={ref} style={{
      background: '#09090b', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, padding: 28,
      transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color + '55';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 0 30px ${color}18`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: color + '18', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>{icon}</div>
      <h3 style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

/* ─── Metric Pill ─── */
function MetricPill({ value, label, color }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { scale: 0.85, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.4)', scrollTrigger: { trigger: ref.current, start: 'top 90%' } }
    );
  }, []);
  return (
    <div ref={ref} style={{
      background: '#09090b', border: `1px solid ${color}28`,
      borderRadius: 14, padding: '20px 24px', textAlign: 'center',
      boxShadow: `0 0 40px ${color}10`,
    }}>
      <div style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, color, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function LandingPage({ onLaunch }) {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
      .fromTo(subRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.4')
      .fromTo(ctaRef.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3')
      .fromTo(imgRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power2.out' },
        '-=0.2'
      );

    // Subtle floating for hero image
    gsap.to(imgRef.current, {
      y: -12, duration: 3.5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2
    });

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <div style={{ background: '#000000', color: '#fff', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: 4, color: '#fff' }}>GUARDIAN</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#features" style={{ color: '#64748b', fontSize: 13.5, textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = '#64748b'}
          >Features</a>
          <a href="#architecture" style={{ color: '#64748b', fontSize: 13.5, textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = '#64748b'}
          >Architecture</a>
          <a href="#mlops" style={{ color: '#64748b', fontSize: 13.5, textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = '#64748b'}
          >MLOps</a>
          <a
            href="https://github.com/Mayank-Chaudhary-011/GAURDIAN"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#94a3b8', fontSize: 12.5, textDecoration: 'none', fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', padding: '7px 14px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <button onClick={onLaunch} className="eval-btn" style={{ padding: '8px 20px', fontSize: 13, borderRadius: 9, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
            Launch App
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} style={{
        position: 'relative', overflow: 'hidden',
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 40px',
      }}>

        {/* Background Gradient Glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 900, height: 500, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.13) 0%, rgba(16,185,129,0.05) 40%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(30px)',
        }} />

        {/* Floating Background Blocks */}
        <FloatingBlock x={-340} y={-120} size={90}  color="#3b82f6" delay={0.3} duration={4.5} rotate={15} />
        <FloatingBlock x={320}  y={-90}  size={60}  color="#10b981" delay={0.6} duration={5}   rotate={-10} />
        <FloatingBlock x={-280} y={180}  size={50}  color="#a78bfa" delay={0.9} duration={5.5} rotate={30} />
        <FloatingBlock x={380}  y={200}  size={80}  color="#f59e0b" delay={0.4} duration={4}   rotate={-20} />
        <FloatingBlock x={-180} y={-220} size={40}  color="#22d3ee" delay={1.1} duration={6}   rotate={45} />
        <FloatingBlock x={240}  y={-200} size={55}  color="#f43f5e" delay={0.8} duration={4.8} rotate={-35} />
        <FloatingBlock x={-420} y={30}   size={65}  color="#3b82f6" delay={1.5} duration={5.2} rotate={20} />
        <FloatingBlock x={450}  y={80}   size={45}  color="#10b981" delay={1.2} duration={4.2} rotate={-15} />

        {/* Title */}
        <h1 ref={titleRef} style={{
          fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
          fontSize: 'clamp(40px, 6.5vw, 76px)', fontWeight: 800,
          letterSpacing: '-2.5px', lineHeight: 1.05,
          textAlign: 'center', maxWidth: 980, marginBottom: 24, marginTop: 20,
          background: 'linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Evaluate, Secure &amp;<br/>Audit Your LLMs<br/>
          <span style={{
            background: 'linear-gradient(90deg, #3b82f6, #10b981)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>in Production</span>
        </h1>

        {/* Sub */}
        <p ref={subRef} style={{
          fontSize: 'clamp(15px, 2.2vw, 20px)', color: '#64748b',
          maxWidth: 780, textAlign: 'center', lineHeight: 1.65,
          marginBottom: 40, fontWeight: 400,
        }}>
          GUARDIAN combines a <strong style={{ color: '#94a3b8', fontWeight: 600 }}>LangGraph multi-critic pipeline</strong>,
          zero-token security guardrails, 1-in-5 smart sampling proxy routing,
          and an <strong style={{ color: '#94a3b8', fontWeight: 600 }}>MLOps model benchmark suite</strong> into one command center.
        </p>

        {/* CTA Row */}
        <div ref={ctaRef} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 64 }}>
          <button onClick={onLaunch} className="eval-btn" style={{ padding: '15px 34px', fontSize: 15, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Launch Command Center
          </button>
          <a
            href="https://github.com/Mayank-Chaudhary-011/GAURDIAN"
            target="_blank" rel="noreferrer"
            className="clear-btn"
            style={{ padding: '15px 28px', fontSize: 15, borderRadius: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            View Source
          </a>
        </div>

        {/* Live Dashboard Screenshot */}
        <div ref={imgRef} style={{ width: '100%', maxWidth: 1040, position: 'relative', zIndex: 2 }}>
          {/* Glow behind the screenshot */}
          <div style={{
            position: 'absolute', inset: -2,
            background: 'linear-gradient(135deg, #3b82f6, #10b981, #a78bfa)',
            borderRadius: 18, filter: 'blur(1px)', opacity: 0.5, zIndex: -1
          }} />
          <div style={{
            background: '#09090b', borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(59,130,246,0.15)',
          }}>
            {/* Browser chrome bar */}
            <div style={{
              padding: '10px 16px', background: '#111113',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
              <span style={{
                flex: 1, background: '#1a1a1e', borderRadius: 6, padding: '4px 12px',
                fontSize: 11, color: '#64748b', fontFamily: 'Space Grotesk, monospace', marginLeft: 8
              }}>
                guardian-ecru.vercel.app
              </span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>LIVE</span>
            </div>
            <img
              src="/dashboard.png"
              alt="GUARDIAN Dashboard Screenshot"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* ── Metrics Row ── */}
      <section style={{ padding: '64px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <MetricPill value="~80%" label="Token Cost Reduction via Smart Sampling" color="#3b82f6" />
          <MetricPill value="<15ms" label="Security Pre-Check Latency" color="#10b981" />
          <MetricPill value="4 Models" label="MLOps Benchmark (RF · ET · LR · NB)" color="#a78bfa" />
          <MetricPill value="100%" label="Prompt Injection Protection" color="#f59e0b" />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '64px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <div className="sec-label" style={{ marginBottom: 10, fontFamily: "'Outfit', sans-serif", letterSpacing: 3 }}>Capabilities</div>
        <h2 style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: '-1px' }}>
          Engineered for Production LLM Stacks
        </h2>
        <p style={{ fontSize: 14.5, color: '#64748b', marginBottom: 40, maxWidth: 580 }}>
          Not a toy prototype. Every module is built with production-grade patterns — token budgets, security gates, and observability baked in.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          <FeatureCard delay={0} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          } color="#3b82f6" title="LangGraph Multi-Critic Engine"
            desc="Accuracy, Relevance, and Completeness critics run through a StateGraph. An Adjudicator node weighs verdicts and returns a deterministic PASS / FAIL with reasoning." />
          <FeatureCard delay={1} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          } color="#10b981" title="Zero-Token Security Guard"
            desc="AST + regex pre-check fires in <15ms before any LLM call. Blocks 30+ prompt injection patterns, jailbreaks, DAN mode, and credential extraction attempts." />
          <FeatureCard delay={2} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          } color="#a78bfa" title="1-in-5 Smart Sampling Proxy"
            desc="Transparent OpenAI-compatible proxy evaluates 20% of traffic on a round-robin schedule. Suspicious short responses are always force-evaluated regardless of sample rate." />
          <FeatureCard delay={3} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          } color="#f59e0b" title="MLOps Dataset Audit Suite"
            desc="Upload any CSV. GUARDIAN trains Random Forest, Extra Trees, Logistic Regression, and Naive Bayes, then diagnoses underfitting vs. overfitting with F1, Precision, and Recall." />
          <FeatureCard delay={4} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
          } color="#22d3ee" title="Real-Time WebSocket Logs"
            desc="Proxy request logs stream live to your dashboard via WebSocket. Every evaluation, block, and passthrough event appears in under 100ms — no polling required." />
          <FeatureCard delay={5} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          } color="#f43f5e" title="Slack Block-Kit Alerts"
            desc="Regression detection compares rolling windows of pass rates. Drops below the threshold trigger rich Slack notifications automatically after every evaluation cycle." />
        </div>
      </section>

      {/* ── Architecture Flow ── */}
      <section id="architecture" style={{ padding: '64px 24px', maxWidth: 1080, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="sec-label" style={{ marginBottom: 10, fontFamily: "'Outfit', sans-serif", letterSpacing: 3 }}>System Design</div>
        <h2 style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, marginBottom: 40, letterSpacing: '-1px' }}>
          How GUARDIAN Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { step: '01', label: 'Security Guard', sub: 'Regex + AST scan', color: '#f43f5e' },
            { step: '02', label: 'Preprocess', sub: 'Token optimization + type inference', color: '#f59e0b' },
            { step: '03', label: 'Accuracy Critic', sub: 'Factual hallucination scan', color: '#3b82f6' },
            { step: '04', label: 'Relevance Critic', sub: 'Intent alignment check', color: '#a78bfa' },
            { step: '05', label: 'Completeness', sub: 'Coverage + gap analysis', color: '#10b981' },
            { step: '06', label: 'Adjudicator', sub: 'Weighted final PASS / FAIL', color: '#22d3ee' },
          ].map((s, i) => {
            const ref = useRef(null);
            useEffect(() => {
              if (!ref.current) return;
              gsap.fromTo(ref.current,
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5, delay: i * 0.09, ease: 'power2.out', scrollTrigger: { trigger: ref.current, start: 'top 90%' } }
              );
            }, []);
            return (
              <div key={i} ref={ref} style={{
                background: '#09090b', border: `1px solid ${s.color}22`,
                borderRadius: 12, padding: 18,
                borderLeft: `3px solid ${s.color}`,
              }}>
                <div style={{ fontFamily: "'Space Grotesk', monospace", fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: 2, marginBottom: 6 }}>{s.step}</div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5 }}>{s.sub}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section id="mlops" style={{ padding: '64px 24px', maxWidth: 1080, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="sec-label" style={{ marginBottom: 10, fontFamily: "'Outfit', sans-serif", letterSpacing: 3 }}>Tech Stack</div>
        <h2 style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, marginBottom: 32, letterSpacing: '-1px' }}>
          Built With Production-Grade Tools
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {['Python 3.11', 'FastAPI', 'LangGraph', 'LangChain', 'OpenAI API', 'Groq API', 'Scikit-Learn', 'TF-IDF', 'React 18', 'Vite', 'GSAP', 'WebSockets', 'Supabase', 'Render', 'Vercel'].map((t, i) => (
            <span key={i} style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'rgba(255,255,255,0.04)', color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Outfit', sans-serif",
            }}>{t}</span>
          ))}
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section style={{
        padding: '80px 24px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'linear-gradient(to bottom, #000000, #030712)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <h2 style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, marginBottom: 16, letterSpacing: '-1.5px' }}>
          Ready to Guard Your<br />
          <span style={{ background: 'linear-gradient(90deg, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LLM Pipeline?</span>
        </h2>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
          Launch the live command center. No sign-up required. Bring your own OpenAI key or run on Groq for free.
        </p>
        <button onClick={onLaunch} className="eval-btn" style={{ padding: '16px 42px', fontSize: 16, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Launch GUARDIAN
        </button>
        <div style={{ marginTop: 32, fontSize: 12, color: '#334155', fontFamily: "'Outfit', sans-serif" }}>
          Open Source · Free to use · Built with LangGraph + FastAPI + React 18
        </div>
      </section>

    </div>
  );
}
