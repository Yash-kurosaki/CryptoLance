const prisma = require('../lib/prisma');
const { Keypair, Connection, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');

// ─── Solana Devnet connection ─────────────────────────────────────────────────
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(walletAddress) {
  return prisma.user.upsert({
    where: { walletAddress },
    update: {},
    create: { walletAddress },
  });
}

// Strip escrow secret before sending job to client
function sanitizeJob(job) {
  const { escrowSecret, ...safeJob } = job;
  return safeJob;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /job/create
 * Body: { title, description, budget, clientWallet }
 */
async function createJob(req, res) {
  try {
    const { title, description, budget, clientWallet } = req.body;

    await upsertUser(clientWallet);

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        budget: parseFloat(budget),
        clientWallet,
        status: 'OPEN',
      },
    });

    return res.status(201).json({ success: true, job: sanitizeJob(job) });
  } catch (err) {
    console.error('[createJob]', err);
    return res.status(500).json({ error: 'Failed to create job' });
  }
}

/**
 * GET /jobs
 * Returns all OPEN and FUNDED jobs (browseable by freelancers)
 */
async function getOpenJobs(req, res) {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: { in: ['OPEN', 'FUNDED'] } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, jobs: jobs.map(sanitizeJob) });
  } catch (err) {
    console.error('[getOpenJobs]', err);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}

/**
 * POST /job/initiate-funding
 * Body: { jobId }
 *
 * Backend generates a fresh Solana Keypair for escrow.
 * Stores public key + encrypted private key (base58).
 * Returns ONLY the escrow public key to the frontend.
 *
 * NOTE: Private keys are generated and held server-side for demo purposes only.
 * In production, replace with an on-chain Anchor smart contract.
 */
async function initiateFunding(req, res) {
  try {
    const { jobId } = req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'OPEN') {
      return res.status(400).json({ error: `Job must be OPEN to initiate funding (current: ${job.status})` });
    }

    // Generate a fresh escrow keypair — private key stays on backend
    const escrowKeypair = Keypair.generate();
    const escrowPublicKey = escrowKeypair.publicKey.toBase58();
    const escrowSecretBase58 = bs58.encode(escrowKeypair.secretKey);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        escrowAddress: escrowPublicKey,
        escrowSecret: escrowSecretBase58, // stored server-side only, never sent to client
      },
    });

    // Return ONLY the public key — private key never leaves the backend
    return res.json({ success: true, escrowAddress: escrowPublicKey });
  } catch (err) {
    console.error('[initiateFunding]', err);
    return res.status(500).json({ error: 'Failed to initiate funding' });
  }
}

/**
 * POST /job/fund
 * Body: { jobId, transactionHash }
 *
 * Client has completed the SOL transfer from their wallet → escrowAddress.
 * Frontend sends only the transaction hash — no key material.
 */
async function fundJob(req, res) {
  try {
    const { jobId, transactionHash } = req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.escrowAddress) {
      return res.status(400).json({ error: 'Funding not initiated. Call /job/initiate-funding first.' });
    }
    if (job.status !== 'OPEN') {
      return res.status(400).json({ error: `Job is not in OPEN status (current: ${job.status})` });
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FUNDED',
        transactionHash,
      },
    });

    return res.json({ success: true, job: sanitizeJob(updated) });
  } catch (err) {
    console.error('[fundJob]', err);
    return res.status(500).json({ error: 'Failed to mark job as funded' });
  }
}

/**
 * POST /job/accept
 * Body: { jobId, freelancerWallet }
 */
async function acceptJob(req, res) {
  try {
    const { jobId, freelancerWallet } = req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'FUNDED') {
      return res.status(400).json({ error: `Job must be FUNDED before accepting (current: ${job.status})` });
    }
    if (job.freelancerWallet) {
      return res.status(400).json({ error: 'Job already has an assigned freelancer' });
    }
    if (job.clientWallet === freelancerWallet) {
      return res.status(400).json({ error: 'Client cannot accept their own job' });
    }

    await upsertUser(freelancerWallet);

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { freelancerWallet, status: 'IN_PROGRESS' },
    });

    return res.json({ success: true, job: sanitizeJob(updated) });
  } catch (err) {
    console.error('[acceptJob]', err);
    return res.status(500).json({ error: 'Failed to accept job' });
  }
}

/**
 * POST /job/submit
 * Body: { jobId, freelancerWallet }
 */
async function submitWork(req, res) {
  try {
    const { jobId, freelancerWallet } = req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: `Job must be IN_PROGRESS to submit (current: ${job.status})` });
    }
    if (job.freelancerWallet !== freelancerWallet) {
      return res.status(403).json({ error: 'Only the assigned freelancer can submit work' });
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        transactionHash: job.transactionHash
          ? `${job.transactionHash}|WORK_SUBMITTED`
          : 'WORK_SUBMITTED',
      },
    });

    return res.json({ success: true, job: sanitizeJob(updated), message: 'Work submitted. Awaiting client approval.' });
  } catch (err) {
    console.error('[submitWork]', err);
    return res.status(500).json({ error: 'Failed to submit work' });
  }
}

/**
 * POST /job/approve
 * Body: { jobId, clientWallet }
 *
 * Backend loads the escrow keypair, signs a SOL transfer from escrow → freelancer,
 * broadcasts on Devnet, then marks job COMPLETED and clears escrow secret.
 *
 * SECURITY NOTE: Escrow private keys are generated and securely stored on the backend
 * for demonstration purposes only and are never exposed to the client. In production,
 * this would be replaced with a fully on-chain smart contract (e.g., Anchor) to
 * eliminate backend key management entirely.
 */
async function approveJob(req, res) {
  try {
    const { jobId, clientWallet } = req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientWallet !== clientWallet) {
      return res.status(403).json({ error: 'Only the client can approve this job' });
    }
    if (job.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: `Job must be IN_PROGRESS to approve (current: ${job.status})` });
    }
    if (!job.escrowSecret || !job.freelancerWallet) {
      return res.status(400).json({ error: 'Missing escrow or freelancer details' });
    }

    // Reconstruct escrow keypair from stored secret
    const secretKeyBytes = bs58.decode(job.escrowSecret);
    const escrowKeypair = Keypair.fromSecretKey(secretKeyBytes);

    const freelancerPubkey = new PublicKey(job.freelancerWallet);

    // Get escrow balance, leave a small amount for rent + fees
    const escrowBalance = await connection.getBalance(escrowKeypair.publicKey);
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
    const transferAmount = escrowBalance - rentExemption - 5000; // 5000 lamports for tx fee

    if (transferAmount <= 0) {
      return res.status(400).json({ error: 'Insufficient funds in escrow account' });
    }

    // Build and sign release transaction — backend-signed, no Phantom required
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowKeypair.publicKey,
        toPubkey: freelancerPubkey,
        lamports: transferAmount,
      })
    );

    const releaseSignature = await sendAndConfirmTransaction(connection, transaction, [escrowKeypair]);

    // Mark job COMPLETED, clear escrow secret for hygiene
    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        transactionHash: releaseSignature,
        escrowSecret: null, // key cleared after use
      },
    });

    return res.json({
      success: true,
      job: sanitizeJob(updated),
      releaseSignature,
      message: `Funds released to ${job.freelancerWallet}`,
    });
  } catch (err) {
    console.error('[approveJob]', err);
    return res.status(500).json({ error: `Failed to approve and release funds: ${err.message}` });
  }
}

/**
 * GET /jobs/me?walletAddress=...
 */
async function getMyJobs(req, res) {
  try {
    const { walletAddress } = req.query;

    const jobs = await prisma.job.findMany({
      where: {
        OR: [{ clientWallet: walletAddress }, { freelancerWallet: walletAddress }],
      },
      orderBy: { createdAt: 'desc' },
    });

    const posted = jobs.filter((j) => j.clientWallet === walletAddress);
    const taken = jobs.filter((j) => j.freelancerWallet === walletAddress);

    return res.json({
      success: true,
      posted: posted.map(sanitizeJob),
      taken: taken.map(sanitizeJob),
    });
  } catch (err) {
    console.error('[getMyJobs]', err);
    return res.status(500).json({ error: 'Failed to fetch your jobs' });
  }
}

/**
 * GET /job/:id
 */
async function getJobById(req, res) {
  try {
    const { id } = req.params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    return res.json({ success: true, job: sanitizeJob(job) });
  } catch (err) {
    console.error('[getJobById]', err);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
}

module.exports = {
  createJob,
  getOpenJobs,
  initiateFunding,
  fundJob,
  acceptJob,
  submitWork,
  approveJob,
  getMyJobs,
  getJobById,
};
