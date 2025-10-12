'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card'
import {
  EnhancedTable,
  EnhancedTableBody,
  EnhancedTableCell,
  EnhancedTableHeader,
  EnhancedTableRow,
} from '@/components/ui/enhanced-table'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import {
  useBillingBalance,
  usePaymentHistory,
  useWithdrawalRequest,
  type PaymentHistoryFilters,
  type BillingTransaction,
} from '@/lib/hooks'

const WITHDRAW_THRESHOLD = 0.05 // ETH threshold placeholder

function formatCurrencyUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)
}

function formatEth(value: string | number) {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value
  if (Number.isNaN(amount)) return '0 ETH'
  return `${amount.toFixed(amount < 1 ? 4 : 2)} ETH`
}

function formatDate(value?: string | Date) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function exportTransactionsToCsv(transactions: BillingTransaction[]) {
  if (!transactions.length) {
    toast.error('No transactions to export')
    return
  }

  const headers = [
    'ID',
    'Type',
    'Amount (USD)',
    'Amount (ETH)',
    'Status',
    'Crawler',
    'URL',
    'Tx Hash',
    'Created At',
    'Completed At',
  ]
  const rows = transactions.map((tx) => [
    tx.id,
    tx.type,
    tx.amount?.toString() ?? '',
    tx.amountEth?.toString() ?? '',
    tx.status,
    tx.crawlerName || tx.crawlerAddress || '',
    tx.url || '',
    tx.txHash || '',
    tx.createdAt,
    tx.completedAt ?? '',
  ])
  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          if (typeof cell === 'string' && cell.includes(',')) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        })
        .join(',')
    )
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'tachi-billing-transactions.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
  toast.success('Exported transaction history')
}

export function BillingTab() {
  const [filters, setFilters] = useState<PaymentHistoryFilters>({ type: 'all', limit: 20, page: 1 })

  const balanceQuery = useBillingBalance()
  const historyQuery = usePaymentHistory(filters)
  const withdrawalMutation = useWithdrawalRequest()

  const balance = balanceQuery.data
  const history = historyQuery.data
  const transactions = history?.transactions ?? []
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')

  useEffect(() => {
    if (balance?.availableToWithdraw) {
      setWithdrawAmount(balance.availableToWithdraw)
    }
    if (balance?.walletAddress) {
      setWithdrawAddress(balance.walletAddress)
    }
  }, [balance?.availableToWithdraw, balance?.walletAddress])

  const canWithdraw = useMemo(() => {
    const available = Number.parseFloat(balance?.availableToWithdraw ?? '0')
    const requested = Number.parseFloat(withdrawAmount || '0')
    return (
      !Number.isNaN(available) &&
      !Number.isNaN(requested) &&
      available >= WITHDRAW_THRESHOLD &&
      requested > 0 &&
      requested <= available &&
      Boolean(withdrawAddress)
    )
  }, [balance?.availableToWithdraw, withdrawAmount, withdrawAddress])

  const handleWithdraw = () => {
    withdrawalMutation.mutate(
      { amount: withdrawAmount, toAddress: withdrawAddress },
      {
        onSuccess: (data) => {
          toast.success(
            data.status === 'completed'
              ? `Withdrawal sent successfully (${data.amount} ETH)`
              : 'Withdrawal request queued for processing'
          )
          setWithdrawAmount('')
          setWithdrawAddress(balance?.walletAddress ?? '')
        },
        onError: (error) => toast.error(error.message),
      }
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <EnhancedCard variant="elevated" className="bg-white">
          <EnhancedCardContent>
            <p className="text-sm font-medium text-[#52796F] uppercase tracking-wide font-['Coinbase Display']">
              Available Balance
            </p>
            <p className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mt-2">
              {formatEth(balance?.availableToWithdraw ?? '0')}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">Funds ready for withdrawal on Base</p>
          </EnhancedCardContent>
        </EnhancedCard>
        <EnhancedCard variant="elevated" className="bg-white">
          <EnhancedCardContent>
            <p className="text-sm font-medium text-[#52796F] uppercase tracking-wide font-['Coinbase Display']">
              Pending Withdrawals
            </p>
            <p className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mt-2">
              {formatEth(balance?.pendingWithdrawal ?? '0')}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">In-flight payouts waiting to settle</p>
          </EnhancedCardContent>
        </EnhancedCard>
        <EnhancedCard variant="elevated" className="bg-white">
          <EnhancedCardContent>
            <p className="text-sm font-medium text-[#52796F] uppercase tracking-wide font-['Coinbase Display']">
              Lifetime Revenue
            </p>
            <p className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mt-2">
              {formatCurrencyUsd(history?.summary.totalEarnings ?? balance?.totalEarnings ?? 0)}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">Aggregated earnings captured in Supabase</p>
          </EnhancedCardContent>
        </EnhancedCard>
        <EnhancedCard variant="elevated" className="bg-white">
          <EnhancedCardContent>
            <p className="text-sm font-medium text-[#52796F] uppercase tracking-wide font-['Coinbase Display']">
              Total Requests
            </p>
            <p className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mt-2">
              {history?.summary.transactionCount ?? balance?.totalRequests ?? 0}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">Number of paid crawl events processed</p>
          </EnhancedCardContent>
        </EnhancedCard>
      </div>

      <EnhancedCard variant="elevated" className="bg-white">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Payouts & Wallet</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs uppercase text-[#6B7280] font-semibold">Wallet Address</p>
              <p className="font-mono text-sm text-[#1A1A1A] mt-1">
                {balance?.walletAddress ?? 'Connect wallet to enable payouts'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs uppercase text-[#6B7280] font-semibold">Last Updated</p>
              <p className="font-mono text-sm text-[#1A1A1A] mt-1">
                {balance?.lastUpdated ? formatDate(balance.lastUpdated as string) : '—'}
              </p>
            </div>
          </div>
          <p className="text-xs text-[#6B7280]">
            Tip: configure a payout threshold that matches your gas budget so on-chain withdrawals remain economical.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#52796F] mb-2">Amount to Withdraw (ETH)</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#52796F] mb-2">Destination Address</label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(event) => setWithdrawAddress(event.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043] font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <EnhancedButton
              className="font-mono tracking-wide"
              disabled={!canWithdraw}
              loading={withdrawalMutation.isPending}
              onClick={handleWithdraw}
            >
              Request Withdrawal
            </EnhancedButton>
            {!canWithdraw && (
              <span className="text-xs text-[#6B7280]">
                Ensure a connected payout wallet and a minimum available balance of {WITHDRAW_THRESHOLD} ETH.
              </span>
            )}
          </div>
        </EnhancedCardContent>
      </EnhancedCard>

      <EnhancedCard variant="elevated" className="bg-white">
        <EnhancedCardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <EnhancedCardTitle>Transaction History</EnhancedCardTitle>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'all', label: 'All' },
                { id: 'earnings', label: 'Earnings' },
                { id: 'withdrawals', label: 'Withdrawals' },
              ].map((option) => (
                <EnhancedButton
                  key={option.id}
                  variant={filters.type === option.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, type: option.id as PaymentHistoryFilters['type'], page: 1 }))}
                >
                  {option.label}
                </EnhancedButton>
              ))}
              <EnhancedButton
                variant="outline"
                size="sm"
                className="font-mono"
                onClick={() => exportTransactionsToCsv(transactions)}
              >
                EXPORT CSV
              </EnhancedButton>
            </div>
          </div>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          {historyQuery.isLoading ? (
            <div className="py-12 text-center text-[#52796F]">Loading transactions...</div>
          ) : historyQuery.isError ? (
            <div className="py-12 text-center text-red-600">
              Failed to load payment history.{' '}
              <button className="underline" onClick={() => historyQuery.refetch()}>
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-[#52796F]">
              No transactions recorded yet. Activity will appear here once crawlers start purchasing access.
            </div>
          ) : (
            <>
              <EnhancedTable>
                <EnhancedTableHeader>
                  <EnhancedTableRow>
                    <EnhancedTableCell>ID</EnhancedTableCell>
                    <EnhancedTableCell>Type</EnhancedTableCell>
                    <EnhancedTableCell>Amount</EnhancedTableCell>
                    <EnhancedTableCell>Status</EnhancedTableCell>
                    <EnhancedTableCell>Counterparty</EnhancedTableCell>
                    <EnhancedTableCell>Created</EnhancedTableCell>
                    <EnhancedTableCell>Tx Hash</EnhancedTableCell>
                  </EnhancedTableRow>
                </EnhancedTableHeader>
              <EnhancedTableBody>
                {transactions.map((tx) => {
                  const destination =
                    tx.notes && typeof tx.notes === 'object' && 'destination' in tx.notes
                      ? (tx.notes as Record<string, any>).destination
                      : null
                  return (
                    <EnhancedTableRow key={tx.id}>
                      <EnhancedTableCell className="font-mono text-xs">{tx.id.slice(0, 10)}...</EnhancedTableCell>
                      <EnhancedTableCell>
                        <EnhancedBadge variant={tx.type === 'earning' ? 'success' : 'info'} size="sm">
                          {tx.type.toUpperCase()}
                        </EnhancedBadge>
                      </EnhancedTableCell>
                      <EnhancedTableCell>
                        <div className="flex flex-col">
                          <span>{formatCurrencyUsd(tx.amount ?? 0)}</span>
                          {tx.amountEth ? <span className="text-xs text-[#6B7280]">{formatEth(tx.amountEth)}</span> : null}
                        </div>
                      </EnhancedTableCell>
                      <EnhancedTableCell>
                        <EnhancedBadge
                          variant={
                            tx.status === 'completed'
                              ? 'success'
                              : tx.status === 'pending'
                              ? 'info'
                              : 'secondary'
                          }
                          size="sm"
                        >
                          {tx.status.toUpperCase()}
                        </EnhancedBadge>
                      </EnhancedTableCell>
                      <EnhancedTableCell>
                        <div className="max-w-xs">
                          <p className="text-sm">{tx.crawlerName ?? '—'}</p>
                          {tx.url ? <p className="text-xs text-[#6B7280] truncate">{tx.url}</p> : null}
                          {destination ? (
                            <p className="text-xs text-[#6B7280] font-mono break-all">Dest: {destination}</p>
                          ) : null}
                        </div>
                      </EnhancedTableCell>
                      <EnhancedTableCell>{formatDate(tx.createdAt)}</EnhancedTableCell>
                      <EnhancedTableCell className="font-mono text-xs break-all">{tx.txHash ?? '—'}</EnhancedTableCell>
                    </EnhancedTableRow>
                  )
                })}
              </EnhancedTableBody>
              </EnhancedTable>
              <div className="flex items-center justify-between mt-4 text-sm text-[#6B7280]">
                <span>
                  Page {history?.pagination.page ?? 1} of {history?.pagination.totalPages ?? 1}
                </span>
                <div className="space-x-3">
                  <button
                    className="text-[#FF7043] disabled:text-gray-400"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: Math.max((prev.page ?? 1) - 1, 1) }))
                    }
                    disabled={(filters.page ?? 1) === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="text-[#FF7043] disabled:text-gray-400"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: Math.min(
                          (prev.page ?? 1) + 1,
                          history?.pagination.totalPages ?? (prev.page ?? 1)
                        ),
                      }))
                    }
                    disabled={(filters.page ?? 1) >= (history?.pagination.totalPages ?? 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </EnhancedCardContent>
      </EnhancedCard>

      <EnhancedCard variant="outline" className="bg-white">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Statements & Compliance</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent className="space-y-3 text-sm text-[#52796F]">
          <p>
            Download monthly CSV exports for bookkeeping and share the transaction ledger with accounting teams. 1099
            summaries will be available once payout volume crosses regulatory thresholds.
          </p>
          <p>
            Need a reconciliation report or have payout questions? Reach out to{' '}
            <a href="mailto:support@tachi.network" className="text-[#FF7043] underline">
              support@tachi.network
            </a>
            .
          </p>
        </EnhancedCardContent>
      </EnhancedCard>
    </div>
  )
}

export default BillingTab
