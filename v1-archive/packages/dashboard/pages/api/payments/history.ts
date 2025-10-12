import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { authenticatePublisher } from '@/lib/server/authenticate'
import { ensurePublisherProfile } from '@/lib/server/publisher-profile'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['all', 'earnings', 'withdrawals']).default('all'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

interface Transaction {
  id: string
  type: 'earning' | 'withdrawal'
  amount: number // in USD for earnings, ETH for withdrawals
  amountEth?: number // if withdrawal
  status: 'completed' | 'pending' | 'failed'
  crawlerAddress?: string
  crawlerName?: string
  url?: string
  txHash?: string
  blockNumber?: number
  createdAt: Date
  completedAt?: Date
  notes?: string
}

interface PaymentHistory {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalEarnings: number
    totalWithdrawals: number
    pendingWithdrawals: number
    transactionCount: number
  }
}

async function getTransactions(
  publisherId: string,
  options: z.infer<typeof QuerySchema>
): Promise<{ transactions: Transaction[]; total: number }> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  const offset = (options.page - 1) * options.limit

  let query = supabaseAdmin
    .from('billing_transactions')
    .select('*', { count: 'exact' })
    .eq('publisher_id', publisherId)
    .order('created_at', { ascending: false })
    .range(offset, offset + options.limit - 1)

  // Apply date filters if provided
  if (options.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate)
  }

  // Apply type filter
  if (options.type === 'earnings') {
    query = query.eq('type', 'earning')
  } else if (options.type === 'withdrawals') {
    query = query.eq('type', 'withdrawal')
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Failed to fetch transactions:', error)
    return { transactions: [], total: 0 }
  }

  const transactions: Transaction[] = (data || []).map((row) => ({
    id: row.id,
    type: row.type || 'earning',
    amount: parseFloat(row.amount) || 0,
    amountEth: row.amount_eth ? parseFloat(row.amount_eth) : undefined,
    status: row.status || 'completed',
    crawlerAddress: row.crawler_address,
    crawlerName: row.crawler_name,
    url: row.url,
    txHash: row.tx_hash,
    blockNumber: row.block_number,
    createdAt: new Date(row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    notes: row.notes,
  }))

  return { transactions, total: count || 0 }
}

async function getPaymentSummary(publisherId: string): Promise<{
  totalEarnings: number
  totalWithdrawals: number
  pendingWithdrawals: number
  transactionCount: number
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  const { data: balance } = await supabaseAdmin
    .from('billing_balances')
    .select('total_earnings_usd, total_requests, pending_withdrawal_wei')
    .eq('publisher_id', publisherId)
    .single()

  if (!balance) {
    return {
      totalEarnings: 0,
      totalWithdrawals: 0,
      pendingWithdrawals: 0,
      transactionCount: 0,
    }
  }

  const { data: withdrawalStats } = await supabaseAdmin
    .from('billing_transactions')
    .select('amount, status')
    .eq('publisher_id', publisherId)
    .eq('type', 'withdrawal')

  let totalWithdrawals = 0
  let pendingWithdrawals = 0
  for (const row of withdrawalStats ?? []) {
    const value = parseFloat(row.amount ?? '0') || 0
    if (row.status === 'pending') {
      pendingWithdrawals += value
    } else if (row.status === 'completed') {
      totalWithdrawals += value
    }
  }

  return {
    totalEarnings: parseFloat(balance.total_earnings_usd ?? '0') || 0,
    totalWithdrawals,
    pendingWithdrawals,
    transactionCount: balance.total_requests ?? 0,
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

    // Parse and validate query parameters
    const options = QuerySchema.parse(req.query)

    // Get transactions
    const { transactions, total } = await getTransactions(profile.id, options)

    // Get summary
    const summary = await getPaymentSummary(profile.id)

    const response: PaymentHistory = {
      transactions,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
      summary,
    }

    return res.status(200).json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      })
    }
    if (error instanceof Error && error.message.includes('Supabase')) {
      return res.status(500).json({ error: error.message })
    }

    console.error('Payment history error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
