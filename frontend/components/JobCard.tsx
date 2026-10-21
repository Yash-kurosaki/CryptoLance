'use client';

import Link from 'next/link';
import { Job } from '@/lib/api';
import { shortenAddress } from '@/lib/solana';

interface JobCardProps {
  job: Job;
  walletAddress?: string | null;
}

const STATUS_CONFIG = {
  OPEN: { label: 'Open', className: 'badge-open', dot: 'bg-violet-400' },
  FUNDED: { label: 'Funded', className: 'badge-funded', dot: 'bg-cyan-400' },
  IN_PROGRESS: { label: 'In Progress', className: 'badge-progress', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', className: 'badge-completed', dot: 'bg-emerald-400' },
};

export default function JobCard({ job, walletAddress }: JobCardProps) {
  const statusConfig = STATUS_CONFIG[job.status];
  const isClient = walletAddress === job.clientWallet;
  const isFreelancer = walletAddress === job.freelancerWallet;

  const roleLabel = isClient ? 'Client' : isFreelancer ? 'Freelancer' : null;
  const roleBg = isClient
    ? 'bg-brand-purple/10 text-brand-violet border border-brand-purple/20'
    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <Link href={`/job/${job.id}`} className="block group">
      <article className="glass-card p-5 transition-all duration-200 cursor-pointer group-hover:shadow-brand-sm">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text-primary group-hover:text-brand-violet transition-colors truncate">
              {job.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {roleLabel && (
              <span className={`badge text-xs ${roleBg}`}>
                {roleLabel}
              </span>
            )}
            <span className={statusConfig.className}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
          {job.description}
        </p>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            {/* Budget */}
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-brand-violet">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v2m0 8v2M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-bold text-text-primary">{job.budget} SOL</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Client */}
            <span className="address-pill hidden sm:inline-flex">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
              {shortenAddress(job.clientWallet)}
            </span>

            {/* Date */}
            <span className="text-xs text-text-muted">{formatDate(job.createdAt)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
