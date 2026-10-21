import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';
import { getPhantomProvider } from './wallet';
import { initiateFunding, fundJob } from './api';

// Devnet only — as per project spec
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

/**
 * Full deposit flow:
 * 1. Call backend /job/initiate-funding → get escrowAddress
 * 2. Build a SystemProgram.transfer transaction
 * 3. Have Phantom sign + send it
 * 4. Call backend /job/fund with the transaction hash
 *
 * The frontend NEVER generates any keypair or handles any private key.
 */
export async function depositFunds(
  jobId: string,
  amountSol: number,
  clientWalletAddress: string
): Promise<{ signature: string; escrowAddress: string }> {
  const provider = getPhantomProvider();
  if (!provider || !provider.publicKey) {
    throw new Error('Wallet not connected');
  }

  // Step 1: Backend generates escrow keypair, returns only pubkey
  const { escrowAddress } = await initiateFunding(jobId);

  // Step 2: Build transfer transaction
  const fromPubkey = new PublicKey(clientWalletAddress);
  const toPubkey = new PublicKey(escrowAddress);
  const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  // Step 3: Phantom signs and sends — user sees popup
  // We use signTransaction + sendRawTransaction for better error handling
  const signed = await (provider as any).signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  // Step 4: Notify backend — no key material, just tx hash
  await fundJob({ jobId, transactionHash: signature });

  return { signature, escrowAddress };
}

/**
 * Trigger approval — backend handles the actual SOL release.
 * Frontend just calls the API; no Phantom interaction needed for release.
 * This is intentional: the backend signs using the stored escrow keypair.
 */
export async function releaseFunds(
  jobId: string,
  clientWallet: string
): Promise<string> {
  // Import here to avoid circular deps
  const { approveJob } = await import('./api');
  const result = await approveJob({ jobId, clientWallet });
  return result.releaseSignature;
}

/**
 * Format a SOL amount for display.
 */
export function formatSol(lamports: number): string {
  return `${(lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
}

/**
 * Shorten a wallet address for display: "ABcd...XYz1"
 */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
