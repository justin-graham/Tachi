import { useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { env } from '../env'
import { showNetworkSwitch, showNetworkSwitched, showError } from '../toast'

const SUPPORTED_CHAINS = [base.id, baseSepolia.id]
const PREFERRED_CHAIN = env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? base.id : baseSepolia.id

export function useNetworkGuard() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain({
    onSuccess: () => {
      const networkName = chainId === base.id ? 'Base' : 'Base Sepolia'
      showNetworkSwitched(networkName)
    },
    onError: (error) => {
      showError(`Failed to switch network: ${error.message}`)
    }
  })
  
  const isOnSupportedChain = SUPPORTED_CHAINS.includes(chainId)
  const isOnPreferredChain = chainId === PREFERRED_CHAIN
  
  // Auto-switch to preferred chain when connected but on wrong network
  useEffect(() => {
    if (isConnected && !isOnSupportedChain && switchChain) {
      const networkName = PREFERRED_CHAIN === base.id ? 'Base' : 'Base Sepolia'
      showNetworkSwitch(networkName)
      switchChain({ chainId: PREFERRED_CHAIN })
    }
  }, [isConnected, isOnSupportedChain, switchChain])
  
  const switchToPreferredChain = () => {
    if (switchChain) {
      const networkName = PREFERRED_CHAIN === base.id ? 'Base' : 'Base Sepolia'
      showNetworkSwitch(networkName)
      switchChain({ chainId: PREFERRED_CHAIN })
    }
  }
  
  const switchToMainnet = () => {
    if (switchChain) {
      showNetworkSwitch('Base')
      switchChain({ chainId: base.id })
    }
  }
  
  const switchToTestnet = () => {
    if (switchChain) {
      showNetworkSwitch('Base Sepolia')
      switchChain({ chainId: baseSepolia.id })
    }
  }
  
  return {
    chainId,
    isOnSupportedChain,
    isOnPreferredChain,
    isSwitching,
    switchToPreferredChain,
    switchToMainnet,
    switchToTestnet,
    preferredChainId: PREFERRED_CHAIN,
    supportedChainIds: SUPPORTED_CHAINS,
  }
}