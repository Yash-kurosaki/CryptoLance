'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { shortenAddress } from '@/lib/solana';

export default function WalletConnectButton() {
  const { walletAddress, isConnecting, connect, disconnect, isConnected } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState('');

  async function handleConnect() {
    setError('');
    try {
      await connect();
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    }
  }

  if (isConnected && walletAddress) {
    return (
      <div className="relative">
        <button
          id="wallet-menu-btn"
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-border-active text-sm font-medium transition-all duration-200 hover:bg-bg-hover"
          style={{ background: 'rgba(124,58,237,0.1)' }}
        >
          {/* Green dot */}
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          <span className="font-mono text-text-primary">{shortenAddress(walletAddress)}</span>
          <svg className={`w-3.5 h-3.5 text-text-secondary transition-transform ${showMenu ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-52 glass-card py-1 shadow-brand animate-fade-in">
            <div className="px-4 py-2.5 border-b border-border-subtle">
              <p className="text-xs text-text-muted mb-1">Connected wallet</p>
              <p className="text-xs font-mono text-brand-violet break-all">{walletAddress}</p>
            </div>
            <button
              id="wallet-disconnect-btn"
              onClick={() => { disconnect(); setShowMenu(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        id="wallet-connect-btn"
        onClick={handleConnect}
        disabled={isConnecting}
        className="btn-primary"
      >
        {isConnecting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 13a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
              <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Connect Wallet
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
