'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import WalletConnectButton from '@/components/WalletConnectButton';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="text-brand-violet">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Trustless Escrow',
    description: 'Funds are locked in a Solana escrow account — released only when you approve.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="text-brand-pink">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Instant Payments',
    description: 'SOL transfers settle in seconds on Devnet. No banks, no delays, no intermediaries.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="text-brand-cyan">
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    title: 'No Middleman',
    description: 'Your wallet is your identity. No sign-ups, no KYC, no platform fees.',
  },
];

const STEPS = [
  { step: '01', label: 'Post a Job', desc: 'Describe your project and set a budget in SOL.' },
  { step: '02', label: 'Deposit to Escrow', desc: 'Lock funds via Phantom before a freelancer accepts.' },
  { step: '03', label: 'Work Gets Done', desc: 'Freelancer accepts, works, and submits for review.' },
  { step: '04', label: 'Release Payment', desc: 'Approve and funds flow instantly to the freelancer.' },
];

export default function LandingPage() {
  const { isConnected } = useWallet();

  return (
    <div className="relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-hero" />

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-purple/30 bg-brand-purple/10 text-xs font-semibold text-brand-violet mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-violet animate-pulse-slow" />
          Built on Solana Devnet
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 animate-slide-up"
          style={{ letterSpacing: '-0.03em' }}>
          Hire &amp; Work{' '}
          <span style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 60%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Trustlessly
          </span>
          <br />on Solana
        </h1>

        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
          A decentralized freelancing platform where your wallet is your identity and
          funds are protected by on-chain escrow — no middlemen, no disputes, no trust required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
          {isConnected ? (
            <>
              <Link href="/create" id="hero-post-job-btn" className="btn-primary px-8 py-3.5 text-base">
                Post a Job
              </Link>
              <Link href="/jobs" id="hero-browse-btn" className="btn-secondary px-8 py-3.5 text-base">
                Browse Jobs
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <WalletConnectButton />
              <p className="text-xs text-text-muted">Requires Phantom wallet on Devnet</p>
            </div>
          )}
        </div>

        {/* Hero visual — escrow flow diagram */}
        <div className="mt-16 max-w-2xl mx-auto glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {[
              { label: 'Client Wallet', icon: '👤', color: 'text-brand-violet' },
              { label: '→', icon: '', color: 'text-text-muted' },
              { label: 'Escrow', icon: '🔒', color: 'text-brand-cyan' },
              { label: '→', icon: '', color: 'text-text-muted' },
              { label: 'Freelancer', icon: '💻', color: 'text-brand-green' },
            ].map((item, i) => (
              item.icon ? (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: 'rgba(124,58,237,0.1)' }}>
                    {item.icon}
                  </div>
                  <span className={`text-xs font-semibold ${item.color}`}>{item.label}</span>
                </div>
              ) : (
                <span key={i} className="text-2xl text-text-muted font-light mt-[-16px]">{item.label}</span>
              )
            ))}
          </div>
          <p className="text-xs text-text-muted text-center mt-4">
            Escrow keypair generated on backend · Client deposits via Phantom · Backend signs release
          </p>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-text-primary mb-10">
          Why Cryptolance?
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div key={i} className="glass-card p-6 hover:shadow-brand-sm transition-all duration-300">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(124,58,237,0.1)' }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-text-primary mb-10">
          How It Works
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <div key={i} className="glass-card p-5 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-4xl font-extrabold text-brand-purple/10 select-none">
                {s.step}
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)', color: 'white' }}>
                {parseInt(s.step)}
              </div>
              <h3 className="font-semibold text-text-primary mb-1.5 text-sm">{s.label}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Security note ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="glass-card p-6 border-violet-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-brand-violet">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-violet mb-1">Security Architecture</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Escrow private keys are generated and stored exclusively on the backend and are never
                exposed to the client. This ensures a cleaner and safer architecture even in a demo
                environment. In production, this would be replaced by a fully on-chain smart contract
                (e.g., Anchor) to eliminate backend key management entirely.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
