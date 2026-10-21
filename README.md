# Cryptolance — Trustless Freelancing on Solana

A hackathon-ready MVP demonstrating a trustless escrow freelancing platform built on Solana.  
Clients post jobs, deposit funds via Phantom wallet, freelancers complete work, and payment is released on approval — no middlemen.

## 🏗 Architecture

```
Client Wallet (Phantom)
      │
      │  1. POST /job/initiate-funding → backend generates escrow keypair
      │  2. Phantom sends SOL → escrowAddress
      │  3. POST /job/fund { transactionHash }
      │
      ▼
Escrow Account (keypair stored on backend — never exposed to client)
      │
      │  4. Client approves → backend signs release tx
      │
      ▼
Freelancer Wallet
```

> **Security Note**: Escrow private keys are generated and stored exclusively on the backend and are never exposed to the client. In production, replace with a fully on-chain Anchor smart contract.

## 📁 Project Structure

```
Cryptolance/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── index.js
│   │   ├── controllers/jobController.js
│   │   ├── routes/jobRoutes.js
│   │   ├── middleware/validate.js
│   │   └── lib/prisma.js
│   └── __tests__/job.test.js
└── frontend/
    ├── app/
    │   ├── page.tsx          (Landing)
    │   ├── dashboard/        
    │   ├── create/           
    │   ├── jobs/             (Browse)
    │   └── job/[id]/         (Job detail)
    ├── components/
    ├── lib/                  (api.ts, solana.ts, wallet.ts)
    └── context/WalletContext.tsx
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- [Phantom wallet](https://phantom.app/) browser extension (set to **Devnet**)
- Devnet SOL: [faucet.solana.com](https://faucet.solana.com)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env: set your DATABASE_URL

npm install
npm run db:push        # Push Prisma schema to your DB
npm run dev            # Start API on http://localhost:4000
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev            # Start Next.js on http://localhost:3000
```

## 🌐 API Reference

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/job/create` | `{ title, description, budget, clientWallet }` | Create a job |
| GET | `/jobs/` | — | All OPEN/FUNDED jobs |
| POST | `/job/initiate-funding` | `{ jobId }` | Backend generates escrow keypair, returns pubkey |
| POST | `/job/fund` | `{ jobId, transactionHash }` | Mark job FUNDED |
| POST | `/job/accept` | `{ jobId, freelancerWallet }` | Accept job → IN_PROGRESS |
| POST | `/job/submit` | `{ jobId, freelancerWallet }` | Submit work |
| POST | `/job/approve` | `{ jobId, clientWallet }` | Approve → backend releases SOL → COMPLETED |
| GET | `/jobs/me` | `?walletAddress=` | My posted + taken jobs |
| GET | `/job/:id` | — | Single job detail |

## 🔄 Demo Flow

1. **Connect** Phantom wallet (set to Devnet)
2. **Create** a job → status: `OPEN`
3. **Deposit** → Phantom popup sends SOL to escrow → status: `FUNDED`
4. **Accept** job (second wallet) → status: `IN_PROGRESS`
5. **Submit** work
6. **Approve** → backend releases funds → status: `COMPLETED`

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests use mocked Prisma + Solana — no real DB or network needed.

## 🔐 Job Status Lifecycle

```
OPEN → FUNDED → IN_PROGRESS → COMPLETED
```

## ⚠️ Hackathon Disclaimer

This is a **demo implementation**. In production:
- Replace keypair-based escrow with an Anchor smart contract (PDA)
- Add proper encryption for any stored keys
- Add rate limiting, authentication middleware, and input sanitization
