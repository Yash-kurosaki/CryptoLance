'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { connectWallet, disconnectWallet, getConnectedWallet } from '@/lib/wallet';

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType>({
  walletAddress: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: async () => {},
  isConnected: false,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Silent reconnect on mount
  useEffect(() => {
    getConnectedWallet().then((addr) => {
      if (addr) setWalletAddress(addr);
    });
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
    } catch (err) {
      console.error('Wallet connect error:', err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setWalletAddress(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnecting,
        connect,
        disconnect,
        isConnected: !!walletAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
