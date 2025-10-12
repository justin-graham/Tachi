import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticatePublisher } from '@/lib/server/authenticate'
import { ensurePublisherProfile } from '@/lib/server/publisher-profile'

const WithdrawRequestSchema = z.object({
  amount: z
    .string()
    .refine((value) => {
      const num = parseFloat(value)
      return !Number.isNaN(num) && num > 0
    }, 'Amount must be a positive number'),
  toAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
})

const CRAWL_NFT_ADDRESS = process.env.NEXT_PUBLIC_CRAWL_NFT_ADDRESS as `0x${string}` | undefined
const WITHDRAW_ABI = [
  {
    inputs: [],
    name: 'withdrawPublisherBalance',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'publisher', type: 'address' }],
    name: 'getPublisherBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface WithdrawalRequest {
  id: string
  amount: string
  toAddress: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  txHash?: string | null
  createdAt: Date
  processedAt?: Date
  errorMessage?: string | null
}

async function createWithdrawalRequest(
  publisherId: string,
  userId: string,
  amount: string,
  toAddress: string
): Promise<WithdrawalRequest | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('withdrawal_requests')
    .insert({
      id: undefined,
      publisher_id: publisherId,
      user_id: userId,
      amount_eth: amount,
      to_address: toAddress,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !data) {
    console.error('Failed to create withdrawal request:', error)
    return null
  }

  return {
    id: data.id,
    amount: data.amount_eth,
    toAddress: data.to_address,
    status: data.status,
    txHash: data.tx_hash,
    createdAt: new Date(data.created_at),
    processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
    errorMessage: data.error_message,
  }
}

async function processWithdrawal(
  requestId: string,
  publisherAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!CRAWL_NFT_ADDRESS) {
    return { success: false, error: 'Contract address not configured' }
  }

  const ADMIN_PRIVATE_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY
  if (!ADMIN_PRIVATE_KEY) {
    return { success: false, error: 'Admin wallet not configured' }
  }

  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    })

    const balance = await publicClient.readContract({
      address: CRAWL_NFT_ADDRESS,
      abi: WITHDRAW_ABI,
      functionName: 'getPublisherBalance',
      args: [publisherAddress as `0x${string}`],
    })

    if (balance === 0n) {
      return { success: false, error: 'Insufficient balance' }
    }

    const account = privateKeyToAccount(ADMIN_PRIVATE_KEY as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: base, transport: http() })

    const txHash = await walletClient.writeContract({
      address: CRAWL_NFT_ADDRESS,
      abi: WITHDRAW_ABI,
      functionName: 'withdrawPublisherBalance',
    })

    await supabaseAdmin
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        tx_hash: txHash,
        processed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    return { success: true, txHash }
  } catch (error: any) {
    console.error('Withdrawal processing error:', error)
    await supabaseAdmin
      .from('withdrawal_requests')
      .update({
        status: 'failed',
        error_message: error?.message ?? 'Unknown error',
        processed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
    return { success: false, error: error?.message ?? 'Transaction failed' }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  try {
    const auth = await authenticatePublisher(req)
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const profile = await ensurePublisherProfile(auth.userId)
    const { amount, toAddress } = WithdrawRequestSchema.parse(req.body ?? {})
    const amountWei = parseEther(amount)

    const { data: balanceRow, error: balanceError } = await supabaseAdmin
      .from('billing_balances')
      .select('available_to_withdraw_wei, pending_withdrawal_wei, wallet_address')
      .eq('publisher_id', profile.id)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Failed to read billing balance:', balanceError)
      return res.status(500).json({ error: 'Unable to verify balance' })
    }

    if (!balanceRow) {
      return res.status(400).json({ error: 'No withdrawable balance available' })
    }

    const availableWei = BigInt(balanceRow.available_to_withdraw_wei ?? '0')
    if (amountWei > availableWei) {
      return res.status(400).json({ error: 'Requested amount exceeds available balance' })
    }

    const publisherWallet = balanceRow.wallet_address ?? auth.user.address
    if (!publisherWallet) {
      return res.status(400).json({ error: 'Publisher wallet not connected' })
    }

    const withdrawal = await createWithdrawalRequest(profile.id, auth.userId, amount, toAddress)
    if (!withdrawal) {
      return res.status(500).json({ error: 'Failed to queue withdrawal request' })
    }

    const pendingWei = BigInt(balanceRow.pending_withdrawal_wei ?? '0') + amountWei
    await supabaseAdmin
      .from('billing_balances')
      .update({
        available_to_withdraw_wei: (availableWei - amountWei).toString(),
        pending_withdrawal_wei: pendingWei.toString(),
        last_updated: new Date().toISOString(),
      })
      .eq('publisher_id', profile.id)

    await supabaseAdmin
      .from('billing_transactions')
      .insert({
        id: withdrawal.id,
        publisher_id: profile.id,
        type: 'withdrawal',
        status: 'pending',
        amount,
        amount_eth: amount,
        notes: { destination: toAddress },
      })

    const autoProcess = process.env.AUTO_PROCESS_WITHDRAWALS !== 'false'
    let txHash: string | undefined

    if (autoProcess) {
      const result = await processWithdrawal(withdrawal.id, publisherWallet)
      if (result.success) {
        txHash = result.txHash
        await supabaseAdmin
          .from('billing_transactions')
          .update({
            status: 'completed',
            tx_hash: txHash ?? null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', withdrawal.id)

        const updatedPending = pendingWei - amountWei
        await supabaseAdmin
          .from('billing_balances')
          .update({
            pending_withdrawal_wei: updatedPending.toString(),
            last_updated: new Date().toISOString(),
          })
          .eq('publisher_id', profile.id)
      } else {
        const errorMessage = result.error ?? 'Withdrawal failed'
        await supabaseAdmin
          .from('billing_transactions')
          .update({
            status: 'failed',
            notes: { destination: toAddress, error: errorMessage },
          })
          .eq('id', withdrawal.id)

        await supabaseAdmin
          .from('billing_balances')
          .update({
            available_to_withdraw_wei: availableWei.toString(),
            pending_withdrawal_wei: (pendingWei - amountWei).toString(),
            last_updated: new Date().toISOString(),
          })
          .eq('publisher_id', profile.id)

        return res.status(500).json({ error: errorMessage })
      }
    }

    return res.status(200).json({
      success: true,
      status: autoProcess ? 'completed' : 'pending',
      transactionHash: txHash,
      amount: withdrawal.amount,
      toAddress: withdrawal.toAddress,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.flatten(),
      })
    }

    console.error('Withdrawal request error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
