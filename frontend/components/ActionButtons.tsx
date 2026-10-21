'use client';

import { useState, useCallback } from 'react';
import { Job } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';
import { depositFunds, releaseFunds } from '@/lib/solana';
import { acceptJob, submitWork } from '@/lib/api';

interface ActionButtonsProps {
  job: Job;
  onJobUpdate: (job: Job) => void;
}

type ToastType = 'success' | 'error';

interface Toast {
  type: ToastType;
  message: string;
}

export default function ActionButtons({ job, onJobUpdate }: ActionButtonsProps) {
  const { walletAddress, isConnected } = useWallet();
  const [loading, setLoading] = useState<string | null>(null); // tracks which action is loading
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ─── Role determination (no roles stored — purely dynamic) ──────────────────
  const isClient = isConnected && walletAddress === job.clientWallet;
  const isFreelancer = isConnected && walletAddress === job.freelancerWallet;
  const isVisitor = isConnected && !isClient && !isFreelancer;

  const workSubmitted = job.transactionHash?.includes('WORK_SUBMITTED') ?? false;

  // ─── Action handlers ─────────────────────────────────────────────────────────

  async function handleDeposit() {
    if (!walletAddress) return;
    setLoading('deposit');
    try {
      const { signature, escrowAddress } = await depositFunds(job.id, job.budget, walletAddress);
      showToast('success', `Deposited ${job.budget} SOL to escrow! Tx: ${signature.slice(0, 8)}...`);
      // Optimistic update
      onJobUpdate({ ...job, status: 'FUNDED', escrowAddress });
    } catch (err: any) {
      showToast('error', err.message || 'Deposit failed. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  async function handleApprove() {
    if (!walletAddress) return;
    setLoading('approve');
    try {
      const { job: updatedJob, releaseSignature } = await releaseFundsAction();
      showToast('success', `Funds released! Tx: ${releaseSignature.slice(0, 8)}...`);
      onJobUpdate(updatedJob);
    } catch (err: any) {
      showToast('error', err.message || 'Approval failed. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  async function releaseFundsAction() {
    const { approveJob } = await import('@/lib/api');
    return approveJob({ jobId: job.id, clientWallet: walletAddress! });
  }

  async function handleAccept() {
    if (!walletAddress) return;
    setLoading('accept');
    try {
      const { job: updatedJob } = await acceptJob({ jobId: job.id, freelancerWallet: walletAddress });
      showToast('success', 'You accepted the job! Get started.');
      onJobUpdate(updatedJob);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to accept job.');
    } finally {
      setLoading(null);
    }
  }

  async function handleSubmit() {
    if (!walletAddress) return;
    setLoading('submit');
    try {
      const { job: updatedJob } = await submitWork({ jobId: job.id, freelancerWallet: walletAddress });
      showToast('success', 'Work submitted! Waiting for client approval.');
      onJobUpdate(updatedJob);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit work.');
    } finally {
      setLoading(null);
    }
  }

  // ─── Spinner helper ──────────────────────────────────────────────────────────
  function Spinner() {
    return (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }

  // ─── Wallet not connected ────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="glass-card p-4 text-center">
        <p className="text-sm text-text-secondary">Connect your wallet to interact with this job.</p>
      </div>
    );
  }

  // ─── Job completed ───────────────────────────────────────────────────────────
  if (job.status === 'COMPLETED') {
    return (
      <div className="glass-card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-emerald-400">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-400">Job Completed</p>
          <p className="text-xs text-text-muted">Funds have been released to the freelancer.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── Client actions ────────────────────────────────────────────────────── */}
      {isClient && (
        <div className="space-y-3">
          {job.status === 'OPEN' && (
            <div className="space-y-2">
              <button
                id="deposit-funds-btn"
                onClick={handleDeposit}
                disabled={loading === 'deposit'}
                className="btn-primary w-full py-3"
              >
                {loading === 'deposit' ? <><Spinner /> Sending to Escrow...</> : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Deposit {job.budget} SOL to Escrow
                  </>
                )}
              </button>
              <p className="text-xs text-text-muted text-center">
                Phantom will prompt you to confirm. Funds go to a secure escrow account.
              </p>
            </div>
          )}

          {job.status === 'FUNDED' && (
            <div className="glass-card p-3 flex items-center gap-2 border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-slow" />
              <p className="text-xs text-cyan-400">Waiting for a freelancer to accept this job…</p>
            </div>
          )}

          {job.status === 'IN_PROGRESS' && (
            <div className="space-y-2">
              {workSubmitted ? (
                <button
                  id="approve-work-btn"
                  onClick={handleApprove}
                  disabled={loading === 'approve'}
                  className="btn-green w-full py-3"
                >
                  {loading === 'approve' ? <><Spinner /> Releasing Funds...</> : (
                    <>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Approve &amp; Release Funds
                    </>
                  )}
                </button>
              ) : (
                <div className="glass-card p-3 flex items-center gap-2 border-amber-500/20">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-slow" />
                  <p className="text-xs text-amber-400">Waiting for freelancer to submit work…</p>
                </div>
              )}
              <p className="text-xs text-text-muted text-center">
                Backend signs the release transaction — no second Phantom popup needed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Freelancer actions ────────────────────────────────────────────────── */}
      {isFreelancer && (
        <div className="space-y-3">
          {job.status === 'IN_PROGRESS' && !workSubmitted && (
            <div className="space-y-2">
              <button
                id="submit-work-btn"
                onClick={handleSubmit}
                disabled={loading === 'submit'}
                className="btn-cyan w-full py-3"
              >
                {loading === 'submit' ? <><Spinner /> Submitting...</> : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Submit Work
                  </>
                )}
              </button>
              <p className="text-xs text-text-muted text-center">
                Let the client know you're done. They'll review and release funds.
              </p>
            </div>
          )}

          {workSubmitted && (
            <div className="glass-card p-3 flex items-center gap-2 border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-xs text-emerald-400">Work submitted! Waiting for client approval.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Visitor actions (accept job) ─────────────────────────────────────── */}
      {isVisitor && (job.status === 'FUNDED') && !job.freelancerWallet && (
        <div className="space-y-2">
          <button
            id="accept-job-btn"
            onClick={handleAccept}
            disabled={loading === 'accept'}
            className="btn-secondary w-full py-3 border-brand-purple/30 text-brand-violet hover:bg-brand-purple/10"
          >
            {loading === 'accept' ? <><Spinner /> Accepting...</> : (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
                    stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 14v2a2 2 0 01-2 2H6l-4 4V6a2 2 0 012-2h8a2 2 0 012 2v2"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Accept This Job
              </>
            )}
          </button>
          <p className="text-xs text-text-muted text-center">
            Funds are already locked in escrow — you'll get paid upon client approval.
          </p>
        </div>
      )}

      {isVisitor && job.status === 'OPEN' && (
        <div className="glass-card p-3 flex items-center gap-2 border-violet-500/20">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse-slow" />
          <p className="text-xs text-violet-400">Waiting for client to deposit funds before accepting.</p>
        </div>
      )}

      {/* ─── Toast notification ───────────────────────────────────────────────── */}
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          {toast.message}
        </div>
      )}
    </>
  );
}
