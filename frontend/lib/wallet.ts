// Phantom wallet provider types
export interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toString(): string } | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  signTransaction: (tx: unknown) => Promise<unknown>;
  signAllTransactions: (txs: unknown[]) => Promise<unknown[]>;
  request: (params: { method: string; params?: unknown }) => Promise<unknown>;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

/**
 * Returns the Phantom provider if available in the browser.
 */
export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

/**
 * Connect Phantom wallet and return the public key string.
 */
export async function connectWallet(): Promise<string> {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error('Phantom wallet not found. Please install the Phantom browser extension.');
  }
  const response = await provider.connect();
  return response.publicKey.toString();
}

/**
 * Disconnect Phantom wallet.
 */
export async function disconnectWallet(): Promise<void> {
  const provider = getPhantomProvider();
  if (provider) await provider.disconnect();
}

/**
 * Check if wallet is already connected (silent check).
 */
export async function getConnectedWallet(): Promise<string | null> {
  const provider = getPhantomProvider();
  if (!provider) return null;
  try {
    const response = await provider.connect({ onlyIfTrusted: true });
    return response.publicKey.toString();
  } catch {
    return null;
  }
}
