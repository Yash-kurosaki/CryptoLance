'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { createJob } from '@/lib/api';

export default function CreateJobForm() {
  const { walletAddress } = useWallet();
  const router = useRouter();

  const [form, setForm] = useState({ title: '', description: '', budget: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.trim().length < 5) e.title = 'Title must be at least 5 characters';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.trim().length < 20) e.description = 'Description must be at least 20 characters';
    if (!form.budget) e.budget = 'Budget is required';
    else if (parseFloat(form.budget) <= 0) e.budget = 'Budget must be greater than 0';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!walletAddress) {
      setApiError('Please connect your wallet first');
      return;
    }

    setSubmitting(true);
    try {
      const { job } = await createJob({
        title: form.title.trim(),
        description: form.description.trim(),
        budget: parseFloat(form.budget),
        clientWallet: walletAddress,
      });
      router.push(`/job/${job.id}`);
    } catch (err: any) {
      setApiError(err.message || 'Failed to create job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Title */}
      <div>
        <label htmlFor="job-title" className="label">Job Title</label>
        <input
          id="job-title"
          type="text"
          placeholder="e.g. Build a Solana NFT Marketplace UI"
          value={form.title}
          onChange={handleChange('title')}
          className="input-field"
          maxLength={100}
        />
        {errors.title && <p className="mt-1.5 text-xs text-red-400">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="job-description" className="label">Description</label>
        <textarea
          id="job-description"
          placeholder="Describe the work, requirements, deliverables, and timeline..."
          value={form.description}
          onChange={handleChange('description')}
          rows={6}
          className="input-field resize-none"
          maxLength={2000}
        />
        <div className="flex justify-between mt-1.5">
          {errors.description
            ? <p className="text-xs text-red-400">{errors.description}</p>
            : <span />}
          <p className="text-xs text-text-muted">{form.description.length}/2000</p>
        </div>
      </div>

      {/* Budget */}
      <div>
        <label htmlFor="job-budget" className="label">Budget (SOL)</label>
        <div className="relative">
          <input
            id="job-budget"
            type="number"
            placeholder="0.00"
            value={form.budget}
            onChange={handleChange('budget')}
            step="0.01"
            min="0.01"
            className="input-field pr-14"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-brand-violet">
            SOL
          </span>
        </div>
        {errors.budget && <p className="mt-1.5 text-xs text-red-400">{errors.budget}</p>}
        <p className="mt-1.5 text-xs text-text-muted">
          Funds will be locked in escrow and released upon your approval.
        </p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          {apiError}
        </div>
      )}

      {/* Submit */}
      <button
        id="create-job-submit-btn"
        type="submit"
        disabled={submitting}
        className="btn-primary w-full py-3.5 text-base"
      >
        {submitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating Job...
          </>
        ) : (
          'Post Job'
        )}
      </button>
    </form>
  );
}
