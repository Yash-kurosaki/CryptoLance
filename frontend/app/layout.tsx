import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/context/WalletContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Cryptolance — Trustless Freelancing on Solana',
  description:
    'A decentralized freelancing platform powered by Solana. Post jobs, hire talent, and pay via trustless escrow — no middlemen, no trust required.',
  keywords: ['Solana', 'freelancing', 'escrow', 'Web3', 'blockchain', 'DeFi', 'crypto'],
  openGraph: {
    title: 'Cryptolance — Trustless Freelancing on Solana',
    description: 'Hire & work trustlessly. Payments secured by Solana escrow.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <WalletProvider>
          <Navbar />
          <main className="min-h-screen pt-16">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
