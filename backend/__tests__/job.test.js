/**
 * Job API Test Suite
 * Uses Jest manual mocking for Prisma + Solana web3.js — no real DB or network required.
 */

const request = require('supertest');

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
jest.mock('../src/lib/prisma', () => ({
  user: { upsert: jest.fn() },
  job: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
}));

// ─── Mock @solana/web3.js ─────────────────────────────────────────────────────
jest.mock('@solana/web3.js', () => {
  const mockKeypair = {
    publicKey: { toBase58: () => 'MockEscrowPublicKey111' },
    secretKey: new Uint8Array(64).fill(1),
  };
  return {
    Keypair: {
      generate: jest.fn(() => mockKeypair),
      fromSecretKey: jest.fn(() => mockKeypair),
    },
    Connection: jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue(2_000_000_000), // 2 SOL in lamports
      getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(890_880),
    })),
    Transaction: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockReturnThis(),
    })),
    SystemProgram: {
      transfer: jest.fn().mockReturnValue({}),
    },
    PublicKey: jest.fn().mockImplementation((key) => ({ toBase58: () => key })),
    LAMPORTS_PER_SOL: 1_000_000_000,
    sendAndConfirmTransaction: jest.fn().mockResolvedValue('mock-release-tx-signature'),
  };
});

// ─── Mock bs58 ────────────────────────────────────────────────────────────────
jest.mock('bs58', () => ({
  encode: jest.fn(() => 'mockBase58SecretKey'),
  decode: jest.fn(() => new Uint8Array(64).fill(1)),
}));

const app = require('../src/index');
const prisma = require('../src/lib/prisma');

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const mockJob = {
  id: 'job-123',
  title: 'Build a DeFi Dashboard',
  description: 'Create a dashboard to display wallet balances.',
  budget: 2.5,
  clientWallet: 'ClientWallet111',
  freelancerWallet: null,
  status: 'OPEN',
  escrowAddress: null,
  escrowSecret: null,
  transactionHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.user.upsert.mockResolvedValue({ id: 'user-1', walletAddress: 'ClientWallet111' });
});

// ─── 1. Create Job ─────────────────────────────────────────────────────────────
describe('POST /job/create', () => {
  it('should create a job successfully', async () => {
    prisma.job.create.mockResolvedValue(mockJob);

    const res = await request(app).post('/job/create').send({
      title: 'Build a DeFi Dashboard',
      description: 'Create a dashboard to display wallet balances.',
      budget: 2.5,
      clientWallet: 'ClientWallet111',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.job.title).toBe('Build a DeFi Dashboard');
    expect(res.body.job).not.toHaveProperty('escrowSecret'); // never exposed
    expect(prisma.job.create).toHaveBeenCalledTimes(1);
  });

  it('should fail if required fields are missing', async () => {
    const res = await request(app).post('/job/create').send({ title: 'Incomplete' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
    expect(prisma.job.create).not.toHaveBeenCalled();
  });
});

// ─── 2. Initiate Funding ───────────────────────────────────────────────────────
describe('POST /job/initiate-funding', () => {
  it('should generate escrow keypair and return only public key', async () => {
    prisma.job.findUnique.mockResolvedValue({ ...mockJob, status: 'OPEN' });
    prisma.job.update.mockResolvedValue({
      ...mockJob,
      escrowAddress: 'MockEscrowPublicKey111',
      escrowSecret: 'mockBase58SecretKey',
    });

    const res = await request(app).post('/job/initiate-funding').send({ jobId: 'job-123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.escrowAddress).toBe('MockEscrowPublicKey111');
    // Critically: private key must NOT be in the response
    expect(res.body).not.toHaveProperty('escrowSecret');
    expect(res.body).not.toHaveProperty('secretKey');
  });

  it('should fail if job is not OPEN', async () => {
    prisma.job.findUnique.mockResolvedValue({ ...mockJob, status: 'FUNDED' });

    const res = await request(app).post('/job/initiate-funding').send({ jobId: 'job-123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/must be OPEN/);
  });
});

// ─── 3. Fund Job ───────────────────────────────────────────────────────────────
describe('POST /job/fund', () => {
  it('should mark job FUNDED with only transactionHash from client', async () => {
    prisma.job.findUnique.mockResolvedValue({
      ...mockJob,
      status: 'OPEN',
      escrowAddress: 'MockEscrowPublicKey111',
      escrowSecret: 'mockBase58SecretKey',
    });
    prisma.job.update.mockResolvedValue({
      ...mockJob,
      status: 'FUNDED',
      escrowAddress: 'MockEscrowPublicKey111',
      transactionHash: 'tx-hash-abc',
    });

    const res = await request(app).post('/job/fund').send({
      jobId: 'job-123',
      transactionHash: 'tx-hash-abc',
      // NO escrowSecret — that would be a security violation
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.job.status).toBe('FUNDED');
    expect(res.body.job).not.toHaveProperty('escrowSecret');
  });

  it('should fail if initiate-funding was not called first', async () => {
    prisma.job.findUnique.mockResolvedValue({ ...mockJob, status: 'OPEN', escrowAddress: null });

    const res = await request(app).post('/job/fund').send({
      jobId: 'job-123',
      transactionHash: 'tx-hash-abc',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/initiate-funding/);
  });

  it('should fail if job is already FUNDED', async () => {
    prisma.job.findUnique.mockResolvedValue({
      ...mockJob,
      status: 'FUNDED',
      escrowAddress: 'MockEscrowPublicKey111',
    });

    const res = await request(app).post('/job/fund').send({
      jobId: 'job-123',
      transactionHash: 'tx-hash-abc',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not in OPEN status/);
  });
});

// ─── 4. Accept Job ─────────────────────────────────────────────────────────────
describe('POST /job/accept', () => {
  it('should allow a freelancer to accept a funded job', async () => {
    prisma.job.findUnique.mockResolvedValue({ ...mockJob, status: 'FUNDED', escrowAddress: 'MockEscrow' });
    prisma.user.upsert.mockResolvedValue({ id: 'user-2', walletAddress: 'FreelancerWallet222' });
    prisma.job.update.mockResolvedValue({
      ...mockJob,
      status: 'IN_PROGRESS',
      freelancerWallet: 'FreelancerWallet222',
    });

    const res = await request(app).post('/job/accept').send({
      jobId: 'job-123',
      freelancerWallet: 'FreelancerWallet222',
    });

    expect(res.status).toBe(200);
    expect(res.body.job.status).toBe('IN_PROGRESS');
    expect(res.body.job.freelancerWallet).toBe('FreelancerWallet222');
  });

  it('should fail if job already has a freelancer', async () => {
    prisma.job.findUnique.mockResolvedValue({
      ...mockJob,
      status: 'FUNDED',
      freelancerWallet: 'AlreadyAssigned',
    });

    const res = await request(app).post('/job/accept').send({
      jobId: 'job-123',
      freelancerWallet: 'FreelancerWallet222',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already has an assigned freelancer/);
  });

  it('should fail if client tries to accept their own job', async () => {
    prisma.job.findUnique.mockResolvedValue({ ...mockJob, status: 'FUNDED' });

    const res = await request(app).post('/job/accept').send({
      jobId: 'job-123',
      freelancerWallet: 'ClientWallet111',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Client cannot accept/);
  });
});

// ─── 5. Submit Work ────────────────────────────────────────────────────────────
describe('POST /job/submit', () => {
  const inProgressJob = {
    ...mockJob,
    status: 'IN_PROGRESS',
    freelancerWallet: 'FreelancerWallet222',
    transactionHash: 'escrow-tx',
  };

  it('should allow assigned freelancer to submit work', async () => {
    prisma.job.findUnique.mockResolvedValue(inProgressJob);
    prisma.job.update.mockResolvedValue({
      ...inProgressJob,
      transactionHash: 'escrow-tx|WORK_SUBMITTED',
    });

    const res = await request(app).post('/job/submit').send({
      jobId: 'job-123',
      freelancerWallet: 'FreelancerWallet222',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Awaiting client approval/);
  });

  it('should fail if submitter is not the assigned freelancer', async () => {
    prisma.job.findUnique.mockResolvedValue(inProgressJob);

    const res = await request(app).post('/job/submit').send({
      jobId: 'job-123',
      freelancerWallet: 'Impostor999',
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Only the assigned freelancer/);
  });
});

// ─── 6. Approve Job ────────────────────────────────────────────────────────────
describe('POST /job/approve', () => {
  const inProgressJob = {
    ...mockJob,
    status: 'IN_PROGRESS',
    freelancerWallet: 'FreelancerWallet222',
    escrowAddress: 'MockEscrowPublicKey111',
    escrowSecret: 'mockBase58SecretKey',
    transactionHash: 'escrow-tx|WORK_SUBMITTED',
  };

  it('should release funds via backend-signed tx and mark job COMPLETED', async () => {
    prisma.job.findUnique.mockResolvedValue(inProgressJob);
    prisma.job.update.mockResolvedValue({
      ...inProgressJob,
      status: 'COMPLETED',
      escrowSecret: null,
      transactionHash: 'mock-release-tx-signature',
    });

    const res = await request(app).post('/job/approve').send({
      jobId: 'job-123',
      clientWallet: 'ClientWallet111',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.job.status).toBe('COMPLETED');
    expect(res.body.releaseSignature).toBe('mock-release-tx-signature');
    expect(res.body.job).not.toHaveProperty('escrowSecret'); // cleared and sanitized
  });

  it('should fail if approver is not the client', async () => {
    prisma.job.findUnique.mockResolvedValue(inProgressJob);

    const res = await request(app).post('/job/approve').send({
      jobId: 'job-123',
      clientWallet: 'NotTheClient999',
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Only the client can approve/);
  });

  it('should fail if job is not IN_PROGRESS', async () => {
    prisma.job.findUnique.mockResolvedValue({ ...mockJob, status: 'COMPLETED' });

    const res = await request(app).post('/job/approve').send({
      jobId: 'job-123',
      clientWallet: 'ClientWallet111',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/must be IN_PROGRESS/);
  });
});

// ─── 7. Get My Jobs ────────────────────────────────────────────────────────────
describe('GET /jobs/me', () => {
  it('should correctly separate posted vs taken jobs', async () => {
    const clientJob = { ...mockJob, clientWallet: 'MyWallet', freelancerWallet: null };
    const freelancerJob = {
      ...mockJob,
      id: 'job-456',
      clientWallet: 'OtherClient',
      freelancerWallet: 'MyWallet',
      status: 'IN_PROGRESS',
    };

    prisma.job.findMany.mockResolvedValue([clientJob, freelancerJob]);

    const res = await request(app).get('/jobs/me?walletAddress=MyWallet');

    expect(res.status).toBe(200);
    expect(res.body.posted).toHaveLength(1);
    expect(res.body.taken).toHaveLength(1);
    expect(res.body.posted[0].clientWallet).toBe('MyWallet');
    expect(res.body.taken[0].freelancerWallet).toBe('MyWallet');
  });

  it('should fail if walletAddress query param is missing', async () => {
    const res = await request(app).get('/jobs/me');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/walletAddress/);
  });
});
