'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { getJobById, Job } from '@/lib/api';
import ActionButtons from '@/components/ActionButtons';
import { shortenAddress } from '@/lib/solana';

const STATUS_CONFIG = {
  OPEN: { label: 'Open', className: 'badge-open', dot: 'bg-violet-400', desc: 'Awaiting client funding.' },
  FUNDED: { label: 'Funded', className: 'badge-funded', dot: 'bg-cyan-400', desc: 'Funds locked in escrow. Accepting freelancers.' },
  IN_PROGRESS: { label: 'In Progress', className: 'badge-progress', dot: 'bg-amber-400', desc: 'Freelancer is working on the deliverables.' },
  COMPLETED: { label: 'Completed', className: 'badge-completed', dot: 'bg-emerald-400', desc: 'Work approved. Funds released to freelancer.' },
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { walletAddress } = useWallet();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJob();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchJob() {
    setLoading(true);
    setError('');
    try {
      const { job: data } = await getJobById(id);
      setJob(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="glass-card p-6">
          <div className="skeleton h-7 w-72 mb-4" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-5/6 mb-2" />
          <div className="skeleton h-4 w-4/6 mb-8" />
          <div className="flex gap-4">
            <div className="skeleton h-10 w-32" />
            <div className="skeleton h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-red-400 mb-4">{error || 'Job not found'}</p>
        <Link href="/jobs" className="btn-secondary">Back to Jobs</Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[job.status];
  const isClient = walletAddress === job.clientWallet;
  const workSubmitted = job.transactionHash?.includes('WORK_SUBMITTED') ?? false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8 animate-fade-in">
        <Link href="/jobs" className="hover:text-text-primary transition-colors">Browse Jobs</Link>
        <span>/</span>
        <span className="text-text-secondary truncate max-w-xs">{job.title}</span>
      </nav>

      <div className="space-y-5 animate-slide-up">
        {/* Main card */}
        <div className="glass-card p-6">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-text-primary leading-tight">{job.title}</h1>
            <span className={`${statusConfig.className} flex-shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>

          <p className="text-xs text-text-muted mb-5">{statusConfig.desc}</p>

          {/* Description */}
          <div className="mb-6">
            <span className="label">Description</span>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4 pt-5 border-t border-border-subtle">
            <div>
              <span className="label">Budget</span>
              <p className="text-xl font-bold text-text-primary">{job.budget} <span className="text-sm text-brand-violet">SOL</span></p>
            </div>
            <div>
              <span className="label">Posted</span>
              <p className="text-sm text-text-secondary">
                {new Date(job.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Participants card */}
        <div className="glass-card p-5">
          <span className="label">Participants</span>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Client</span>
              <div className="flex items-center gap-2">
                <span className="address-pill font-mono">{shortenAddress(job.clientWallet, 6)}</span>
                {isClient && <span className="badge bg-brand-purple/10 text-brand-violet border border-brand-purple/20">You</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Freelancer</span>
              {job.freelancerWallet ? (
                <div className="flex items-center gap-2">
                  <span className="address-pill font-mono">{shortenAddress(job.freelancerWallet, 6)}</span>
                  {walletAddress === job.freelancerWallet && (
                    <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">You</span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-text-muted italic">Not assigned yet</span>
              )}
            </div>
            {job.escrowAddress && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Escrow</span>
                <span className="address-pill font-mono">{shortenAddress(job.escrowAddress, 6)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Work submitted indicator */}
        {workSubmitted && job.status === 'IN_PROGRESS' && (
          <div className="glass-card p-4 border-emerald-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-emerald-400">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-400">Work Submitted</p>
              <p className="text-xs text-text-muted">
                {isClient ? 'Review the work and approve to release payment.' : 'Waiting for client approval.'}
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div>
          <span className="label">Actions</span>
          <ActionButtons job={job} onJobUpdate={(updated) => setJob(updated)} />
        </div>

        {/* TX Hash */}
        {job.transactionHash && !job.transactionHash.includes('WORK_SUBMITTED') && (
          <div className="glass-card p-4">
            <span className="label">Transaction</span>
            <a
              href={`https://explorer.solana.com/tx/${job.transactionHash.split('|')[0]}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-brand-cyan hover:text-brand-violet transition-colors break-all"
            >
              {job.transactionHash.split('|')[0]} ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
