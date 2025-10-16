'use client';

import {useConnect, useDisconnect} from 'wagmi';
import {useState} from 'react';
import {useHydrationSafeAddress} from '../hooks/useHydrationSafeAddress';

export function WalletButton() {
  const {address, isConnected, isHydrated} = useHydrationSafeAddress();
  const {connect, connectors} = useConnect();
  const {disconnect} = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);

  if (!isHydrated) {
    return <button className="neo-button bg-gray-200 cursor-not-allowed" disabled>Loading...</button>;
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="neo-card px-4 bg-sage text-white font-mono text-sm" style={{height: '42px', display: 'flex', alignItems: 'center'}}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button onClick={() => disconnect()} className="neo-button bg-white text-sm">Disconnect</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setShowMenu(!showMenu)} className="neo-button neo-button-sage">
        Connect Wallet
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 bg-white border-[3px] border-black min-w-[200px] z-50">
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => {connect({connector}); setShowMenu(false);}}
              className="w-full px-4 py-3 text-left text-black hover:bg-gray-100 font-bold text-sm border-b-[3px] border-black last:border-b-0 block"
            >
              {connector.name === 'Injected' ? 'Browser Wallet' : connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
