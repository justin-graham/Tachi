'use client';

import {WagmiProvider, createConfig, http} from 'wagmi';
import {base, baseSepolia} from 'wagmi/chains';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {injected, metaMask, coinbaseWallet, walletConnect} from 'wagmi/connectors';

const queryClient = new QueryClient();

const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({appName: 'Tachi Protocol'}),
    walletConnect({projectId: '8c4b3c1e5d8f4a2b9e6f3c7d1a4b5e8f'}) // Generic project ID
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http()
  }
});

export function Providers({children}: {children: React.ReactNode}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
