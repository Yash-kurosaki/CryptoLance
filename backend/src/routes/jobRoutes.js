const express = require('express');
const router = express.Router();
const { requireFields, requireQuery } = require('../middleware/validate');
const {
  createJob,
  getOpenJobs,
  initiateFunding,
  fundJob,
  acceptJob,
  submitWork,
  approveJob,
  getMyJobs,
  getJobById,
} = require('../controllers/jobController');

// ─── Job Routes ───────────────────────────────────────────────────────────────

// POST /job/create
router.post('/create', requireFields('title', 'description', 'budget', 'clientWallet'), createJob);

// GET /jobs  — all open/funded jobs
router.get('/', getOpenJobs);

// POST /job/initiate-funding — backend generates escrow keypair, returns only pubkey
router.post('/initiate-funding', requireFields('jobId'), initiateFunding);

// POST /job/fund — client confirms deposit; no key material from frontend
router.post('/fund', requireFields('jobId', 'transactionHash'), fundJob);

// POST /job/accept
router.post('/accept', requireFields('jobId', 'freelancerWallet'), acceptJob);

// POST /job/submit
router.post('/submit', requireFields('jobId', 'freelancerWallet'), submitWork);

// POST /job/approve — backend signs and releases funds from escrow → freelancer
router.post('/approve', requireFields('jobId', 'clientWallet'), approveJob);

// GET /jobs/me?walletAddress=...
router.get('/me', requireQuery('walletAddress'), getMyJobs);

// GET /job/:id
router.get('/:id', getJobById);

module.exports = router;
