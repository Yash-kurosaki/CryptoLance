'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import CreateJobForm from '@/components/CreateJobForm';

export default function CreatePage() {
  const { isConnected, walletAddress } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) router.push('/');
  }, [isConnected, router]);

  if (!isConnected) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
        <Link href="/dashboard" className="hover:text-text-primary transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-text-secondary">Post a Job</span>
      </nav>

      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Post a Job</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Describe your project clearly. Once posted, you'll deposit funds to escrow so
          freelancers know payment is guaranteed.
        </p>
      </div>

      {/* Card */}
      <div className="glass-card p-6 animate-fade-in">
        <CreateJobForm />
      </div>

      {/* Info footer */}
      <div className="mt-5 glass-card p-4 border-violet-500/15">
        <div className="flex items-start gap-3">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-brand-violet mt-0.5 flex-shrink-0">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p className="text-xs text-text-muted leading-relaxed">
            After posting, you'll be taken to the job page where you can deposit your budget
            into escrow via Phantom. Funds are only released when you approve the submitted work.
          </p>
        </div>
      </div>
    </div>
  );
}
