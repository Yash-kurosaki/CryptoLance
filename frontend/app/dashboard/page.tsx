'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { getMyJobs, Job } from '@/lib/api';
import JobList from '@/components/JobList';
import { shortenAddress } from '@/lib/solana';

type Tab = 'posted' | 'taken';

const STATUS_ORDER = { OPEN: 0, FUNDED: 1, IN_PROGRESS: 2, COMPLETED: 3 };

export default function DashboardPage() {
  const { walletAddress, isConnected } = useWallet();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('posted');
  const [posted, setPosted] = useState<Job[]>([]);
  const [taken, setTaken] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConnected || !walletAddress) {
      router.push('/');
      return;
    }
    fetchMyJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, isConnected]);

  async function fetchMyJobs() {
    if (!walletAddress) return;
    setLoading(true);
    setError('');
    try {
      const data = await getMyJobs(walletAddress);
      setPosted(data.posted.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]));
      setTaken(data.taken.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]));
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  const activeJobs = tab === 'posted' ? posted : taken;
  const activeCount = tab === 'posted' ? posted.length : taken.length;

  function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
      <div className="glass-card p-4">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
    );
  }

  const openCount = posted.filter((j) => j.status === 'OPEN').length;
  const inProgressCount = [...posted, ...taken].filter((j) => j.status === 'IN_PROGRESS').length;
  const completedCount = [...posted, ...taken].filter((j) => j.status === 'COMPLETED').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="address-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {walletAddress ? shortenAddress(walletAddress, 6) : ''}
          </span>
          <span className="text-xs text-text-muted">Solana Devnet</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-in">
        <StatCard label="Open Jobs" value={openCount} color="text-brand-violet" />
        <StatCard label="In Progress" value={inProgressCount} color="text-amber-400" />
        <StatCard label="Completed" value={completedCount} color="text-emerald-400" />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
        <Link href="/create" id="dashboard-post-job-btn" className="btn-primary">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Post a Job
        </Link>
        <Link href="/jobs" id="dashboard-browse-btn" className="btn-secondary">
          Browse Open Jobs
        </Link>
        <button onClick={fetchMyJobs} className="btn-secondary ml-auto" title="Refresh">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.13-1.13M19.87 15A9 9 0 015.87 16.13"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border-subtle mb-6">
        {([['posted', 'Jobs I Posted', posted.length], ['taken', 'Jobs I Took', taken.length]] as const).map(
          ([key, label, count]) => (
            <button
              key={key}
              id={`dashboard-tab-${key}`}
              onClick={() => setTab(key)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === key
                  ? 'border-brand-violet text-brand-violet'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
              {!loading && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  tab === key ? 'bg-brand-purple/20 text-brand-violet' : 'bg-bg-hover text-text-muted'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* Job list */}
      <JobList
        jobs={activeJobs}
        walletAddress={walletAddress}
        loading={loading}
        emptyMessage={
          tab === 'posted'
            ? "You haven't posted any jobs yet. Click 'Post a Job' to get started."
            : "You haven't accepted any jobs yet. Browse open jobs to find work."
        }
      />
    </div>
  );
}
