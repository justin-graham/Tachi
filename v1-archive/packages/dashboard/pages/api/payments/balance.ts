import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { createPublicClient, http, formatEther } from 'viem'
import { base } from 'viem/chains'
import { authenticatePublisher } from '@/lib/server/authenticate'
import { ensurePublisherProfile } from '@/lib/server/publisher-profile'

// Import contract ABI and address
const CRAWL_NFT_ADDRESS = process.env.NEXT_PUBLIC_CRAWL_NFT_ADDRESS as `0x${string}`

// Simplified ABI for balance reading
const BALANCE_ABI = [
  {
    inputs: [{ name: 'publisher', type: 'address' }],
    name: 'getPublisherBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'publisher', type: 'address' }],
    name: 'getPendingWithdrawal',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface BalanceInfo {
  // Blockchain balance
  onChainBalance: string // in ETH
  onChainBalanceWei: string // raw wei value
  pendingWithdrawal: string // in ETH
  pendingWithdrawalWei: string // raw wei value

  // Database tracked earnings
  totalEarnings: number // in USD
  totalRequests: number

  // Available vs locked
  availableToWithdraw: string // in ETH
  lockedInEscrow: string // in ETH

  // Metadata
  walletAddress: string | null
  lastUpdated: Date
}

async function getOnChainBalance(walletAddress: string): Promise<{
  balance: bigint
  pendingWithdrawal: bigint
}> {
  if (!CRAWL_NFT_ADDRESS) {
    console.warn('CRAWL_NFT_ADDRESS not configured, returning zero balances')
    return { balance: 0n, pendingWithdrawal: 0n }
  }

  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    })

    const [balance, pendingWithdrawal] = await Promise.all([
      publicClient.readContract({
        address: CRAWL_NFT_ADDRESS,
        abi: BALANCE_ABI,
        functionName: 'getPublisherBalance',
        args: [walletAddress as `0x${string}`],
      }),
      publicClient.readContract({
        address: CRAWL_NFT_ADDRESS,
        abi: BALANCE_ABI,
        functionName: 'getPendingWithdrawal',
        args: [walletAddress as `0x${string}`],
      }),
    ])

    return {
      balance: balance as bigint,
      pendingWithdrawal: pendingWithdrawal as bigint,
    }
  } catch (error) {
    console.error('Failed to read on-chain balance:', error)
    // Return zero if contract doesn't exist or call fails
    return { balance: 0n, pendingWithdrawal: 0n }
  }
}

async function getDatabaseEarnings(publisherId: string): Promise<{
  totalEarnings: number
  totalRequests: number
  onChainBalanceWei: string
  pendingWithdrawalWei: string
  availableToWithdrawWei: string
  lockedInEscrowWei: string
  lastUpdated: string | null
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  const { data: balanceRow } = await supabaseAdmin
    .from('billing_balances')
    .select('*')
    .eq('publisher_id', publisherId)
    .single()

  if (balanceRow) {
    return {
      totalEarnings: parseFloat(balanceRow.total_earnings_usd ?? '0') || 0,
      totalRequests: balanceRow.total_requests ?? 0,
      onChainBalanceWei: balanceRow.on_chain_balance_wei ?? '0',
      pendingWithdrawalWei: balanceRow.pending_withdrawal_wei ?? '0',
      availableToWithdrawWei: balanceRow.available_to_withdraw_wei ?? '0',
      lockedInEscrowWei: balanceRow.locked_in_escrow_wei ?? '0',
      lastUpdated: balanceRow.last_updated ?? null,
    }
  }

  return {
    totalEarnings: 0,
    totalRequests: 0,
    onChainBalanceWei: '0',
    pendingWithdrawalWei: '0',
    availableToWithdrawWei: '0',
    lockedInEscrowWei: '0',
    lastUpdated: null,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const auth = await authenticatePublisher(req)
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const profile = await ensurePublisherProfile(auth.userId)
    const billingSnapshot = await getDatabaseEarnings(profile.id)

    // Get on-chain balance if wallet is connected
    let onChainData = { balance: 0n, pendingWithdrawal: 0n }
    const walletAddress = auth.user.address ?? null
    if (walletAddress) {
      onChainData = await getOnChainBalance(walletAddress)
    } else {
      // fall back to cached billing snapshot if available
      onChainData = {
        balance: BigInt(billingSnapshot.onChainBalanceWei),
        pendingWithdrawal: BigInt(billingSnapshot.pendingWithdrawalWei),
      }
    }

    // Calculate available vs locked
    const availableBalance = onChainData.balance - onChainData.pendingWithdrawal

    const balanceInfo: BalanceInfo = {
      // On-chain balances
      onChainBalance: formatEther(onChainData.balance),
      onChainBalanceWei: onChainData.balance.toString(),
      pendingWithdrawal: formatEther(onChainData.pendingWithdrawal),
      pendingWithdrawalWei: onChainData.pendingWithdrawal.toString(),

      // Database tracked
      totalEarnings: billingSnapshot.totalEarnings,
      totalRequests: billingSnapshot.totalRequests,

      // Available balances
      availableToWithdraw: formatEther(availableBalance),
      lockedInEscrow: formatEther(onChainData.pendingWithdrawal),

      // Metadata
      walletAddress,
      lastUpdated: billingSnapshot.lastUpdated ? new Date(billingSnapshot.lastUpdated) : new Date(),
    }

    return res.status(200).json(balanceInfo)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Supabase')) {
      return res.status(500).json({ error: error.message })
    }

    console.error('Balance fetch error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
