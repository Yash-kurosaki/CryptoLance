'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import WalletConnectButton from './WalletConnectButton';

export default function Navbar() {
  const { isConnected } = useWallet();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border-subtle"
      style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-text-primary group-hover:text-brand-violet transition-colors">
            Crypto<span className="text-brand-violet">lance</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
          <Link href="/jobs" className="hover:text-text-primary transition-colors">Browse Jobs</Link>
          {isConnected && (
            <>
              <Link href="/create" className="hover:text-text-primary transition-colors">Post a Job</Link>
              <Link href="/dashboard" className="hover:text-text-primary transition-colors">Dashboard</Link>
            </>
          )}
        </div>

        <WalletConnectButton />
      </div>
    </nav>
  );
}
