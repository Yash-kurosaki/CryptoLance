'use client';

import { Job } from '@/lib/api';
import JobCard from './JobCard';

interface JobListProps {
  jobs: Job[];
  walletAddress?: string | null;
  emptyMessage?: string;
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="glass-card p-5">
      <div className="flex justify-between mb-3">
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-5 w-20" />
      </div>
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-3/4 mb-4" />
      <div className="flex justify-between pt-3 border-t border-border-subtle">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-24" />
      </div>
    </div>
  );
}

export default function JobList({ jobs, walletAddress, emptyMessage, loading }: JobListProps) {
  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(124,58,237,0.1)' }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-brand-violet">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-text-secondary text-sm">{emptyMessage || 'No jobs found'}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 animate-fade-in">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} walletAddress={walletAddress} />
      ))}
    </div>
  );
}
