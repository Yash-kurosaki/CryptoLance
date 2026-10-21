'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getOpenJobs, Job } from '@/lib/api';
import JobList from '@/components/JobList';
import Link from 'next/link';

export default function BrowseJobsPage() {
  const { walletAddress } = useWallet();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'FUNDED'>('ALL');

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    setError('');
    try {
      const { jobs: data } = await getOpenJobs();
      setJobs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'ALL' ? jobs : jobs.filter((j) => j.status === filter);
  const openCount = jobs.filter((j) => j.status === 'OPEN').length;
  const fundedCount = jobs.filter((j) => j.status === 'FUNDED').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">Browse Jobs</h1>
          <p className="text-sm text-text-secondary">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchJobs} className="btn-secondary py-2">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.13-1.13M19.87 15A9 9 0 015.87 16.13"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Refresh
          </button>
          <Link href="/create" className="btn-primary py-2">Post a Job</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {([['ALL', `All (${jobs.length})`, ''], ['OPEN', `Open (${openCount})`, 'text-brand-violet'], ['FUNDED', `Funded (${fundedCount})`, 'text-cyan-400']] as const).map(
          ([key, label, color]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === key
                  ? 'bg-brand-purple/20 text-brand-violet border border-brand-purple/30'
                  : 'text-text-secondary hover:text-text-primary border border-border-subtle'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="animate-fade-in">
        <JobList
          jobs={filtered}
          walletAddress={walletAddress}
          loading={loading}
          emptyMessage="No jobs available right now. Be the first to post one!"
        />
      </div>
    </div>
  );
}
