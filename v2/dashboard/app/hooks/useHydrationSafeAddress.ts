'use client';

import {useAccount} from 'wagmi';
import {useEffect, useState} from 'react';

/**
 * Hydration-safe wrapper around wagmi's useAccount
 *
 * Prevents hydration mismatches by ensuring server and client
 * render the same initial HTML. The address is only returned
 * after the component has mounted on the client.
 *
 * @returns {object} - address, isConnected, and isHydrated flag
 * @example
 * const { address, isConnected, isHydrated } = useHydrationSafeAddress();
 *
 * // Always check isHydrated before displaying address
 * {isHydrated && address && <span>{address}</span>}
 */
export function useHydrationSafeAddress() {
  const {address, isConnected} = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return undefined during SSR and initial client render
  // This ensures server and client render the same HTML initially
  return {
    address: mounted ? address : undefined,
    isConnected: mounted ? isConnected : false,
    isHydrated: mounted
  };
}
