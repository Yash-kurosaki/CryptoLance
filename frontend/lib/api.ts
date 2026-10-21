const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`);
  }

  return data;
}

// ─── Job Types ────────────────────────────────────────────────────────────────

export type JobStatus = 'OPEN' | 'FUNDED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  clientWallet: string;
  freelancerWallet: string | null;
  status: JobStatus;
  escrowAddress: string | null;
  transactionHash: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function createJob(data: {
  title: string;
  description: string;
  budget: number;
  clientWallet: string;
}): Promise<{ success: boolean; job: Job }> {
  return apiFetch('/job/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getOpenJobs(): Promise<{ success: boolean; jobs: Job[] }> {
  return apiFetch('/jobs/');
}

export async function getJobById(id: string): Promise<{ success: boolean; job: Job }> {
  return apiFetch(`/job/${id}`);
}

export async function initiateFunding(jobId: string): Promise<{ success: boolean; escrowAddress: string }> {
  return apiFetch('/job/initiate-funding', {
    method: 'POST',
    body: JSON.stringify({ jobId }),
  });
}

export async function fundJob(data: {
  jobId: string;
  transactionHash: string;
}): Promise<{ success: boolean; job: Job }> {
  return apiFetch('/job/fund', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function acceptJob(data: {
  jobId: string;
  freelancerWallet: string;
}): Promise<{ success: boolean; job: Job }> {
  return apiFetch('/job/accept', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitWork(data: {
  jobId: string;
  freelancerWallet: string;
}): Promise<{ success: boolean; job: Job; message: string }> {
  return apiFetch('/job/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function approveJob(data: {
  jobId: string;
  clientWallet: string;
}): Promise<{ success: boolean; job: Job; releaseSignature: string }> {
  return apiFetch('/job/approve', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyJobs(walletAddress: string): Promise<{
  success: boolean;
  posted: Job[];
  taken: Job[];
}> {
  return apiFetch(`/jobs/me?walletAddress=${encodeURIComponent(walletAddress)}`);
}
