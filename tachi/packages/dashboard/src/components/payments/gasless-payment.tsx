/**
 * Gasless Payment Component
 * Enables publishers to receive gasless payments through Account Abstraction
 */

import { useState, useEffect } from 'react'
import { type Address } from 'viem'
import { useChainId } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Wallet, Send, DollarSign } from 'lucide-react'
import { useAlchemyAAPayment, type PaymentRequest } from '@/hooks/use-alchemy-aa'
import { tachiConfig } from '@/config'

interface GaslessPaymentProps {
  publisherAddress: Address
  crawlNFTAddress?: Address
  tokenId: bigint
  defaultAmount?: number
  onPaymentSuccess?: (txHash: string) => void
  onPaymentError?: (error: string) => void
}

/**
 * Component for making gasless payments using Account Abstraction
 */
export function GaslessPayment({
  publisherAddress,
  crawlNFTAddress,
  tokenId,
  defaultAmount = 1.0,
  onPaymentSuccess,
  onPaymentError,
}: GaslessPaymentProps) {
  const chainId = useChainId()
  const contractAddresses = tachiConfig.getContractAddresses(chainId)
  
  // Use deployed contract addresses or fallback to props
  const usdcAddress = ((contractAddresses as any).usdc || (contractAddresses as any).mockUSDC) as Address
  const resolvedCrawlNFTAddress = crawlNFTAddress || (contractAddresses as any).crawlNFT as Address
  const paymentProcessorAddress = (contractAddresses as any).paymentProcessor as Address

  const {
    // State
    isInitializing,
    isInitialized,
    isPaymentPending,
    smartAccountAddress,
    usdcBalance,
    lastPaymentResult,
    error,
    
    // Actions
    initialize,
    checkBalance,
    executePayment,
    fundAccount,
    disconnect,
    
    // Utils
    isReady,
    hasError,
    formatBalance,
  } = useAlchemyAAPayment()

  const [paymentAmount, setPaymentAmount] = useState(defaultAmount)
  const [usePaymentProcessor, setUsePaymentProcessor] = useState(!!paymentProcessorAddress)
  const [showFunding, setShowFunding] = useState(false)
  const [fundingAmount, setFundingAmount] = useState(10.0)
  const [fundingKey, setFundingKey] = useState('')

  /**
   * Initialize AA client on mount
   */
  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initialize()
    }
  }, [initialize, isInitialized, isInitializing])

  /**
   * Check balance when smart account is ready
   */
  useEffect(() => {
    if (smartAccountAddress && isReady) {
      checkBalance(usdcAddress)
    }
  }, [smartAccountAddress, isReady, checkBalance, usdcAddress])

  /**
   * Handle payment execution
   */
  const handlePayment = async () => {
    if (!isReady || !smartAccountAddress || !resolvedCrawlNFTAddress) {
      return
    }

    const paymentRequest: PaymentRequest = {
      publisherAddress,
      crawlNFTAddress: resolvedCrawlNFTAddress,
      tokenId,
      amountUSD: paymentAmount,
      usdcAddress,
      paymentProcessorAddress,
      usePaymentProcessor,
    }

    const result = await executePayment(paymentRequest)
    
    if (result?.success && result.hash) {
      onPaymentSuccess?.(result.hash)
    } else if (result?.error) {
      onPaymentError?.(result.error)
    }
  }

  /**
   * Handle funding the smart account
   */
  const handleFunding = async () => {
    if (!fundingKey || !isReady) {
      return
    }

    const success = await fundAccount(
      fundingKey as `0x${string}`,
      usdcAddress,
      fundingAmount
    )

    if (success) {
      setShowFunding(false)
      setFundingKey('')
    }
  }

  /**
   * Check if payment is possible
   */
  const canPay = isReady && 
    usdcBalance !== null && 
    Number(usdcBalance) >= paymentAmount * 1e6 && // Convert to USDC units
    !isPaymentPending

  const balanceInUSD = usdcBalance ? Number(formatBalance(usdcBalance)) : 0

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Gasless Payment
        </CardTitle>
        <CardDescription>
          Pay for crawl access without gas fees using Account Abstraction
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Account Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Smart Account Status</Label>
            {isInitializing && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Initializing
              </Badge>
            )}
            {isReady && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Ready
              </Badge>
            )}
            {hasError && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Error
              </Badge>
            )}
          </div>

          {smartAccountAddress && (
            <div className="text-xs text-muted-foreground">
              Account: {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
            </div>
          )}
        </div>

        <div className="border-t my-4"></div>

        {/* Balance Display */}
        {isReady && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                USDC Balance
              </Label>
              <div className="text-right">
                <div className="font-mono text-sm">
                  ${balanceInUSD.toFixed(2)}
                </div>
                {usdcBalance !== null && (
                  <div className="text-xs text-muted-foreground">
                    {formatBalance(usdcBalance)} USDC
                  </div>
                )}
              </div>
            </div>

            {balanceInUSD < paymentAmount && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient USDC balance. Need ${paymentAmount.toFixed(2)}, have ${balanceInUSD.toFixed(2)}.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="border-t my-4"></div>

        {/* Payment Configuration */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Payment Amount (USD)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              placeholder="1.00"
            />
          </div>

          {paymentProcessorAddress && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useProcessor"
                checked={usePaymentProcessor}
                onChange={(e) => setUsePaymentProcessor(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="useProcessor" className="text-sm">
                Use Payment Processor
              </Label>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Publisher: {publisherAddress.slice(0, 6)}...{publisherAddress.slice(-4)}
          </div>
        </div>

        {/* Error Display */}
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {lastPaymentResult?.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Payment successful! 
              {lastPaymentResult.hash && (
                <div className="mt-1 font-mono text-xs">
                  Tx: {lastPaymentResult.hash.slice(0, 10)}...{lastPaymentResult.hash.slice(-6)}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Funding Section */}
        {showFunding && isReady && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <Label className="text-sm font-medium">Fund Smart Account (Test Only)</Label>
            
            <div className="space-y-2">
              <Label htmlFor="fundingKey" className="text-xs">
                Private Key (with USDC)
              </Label>
              <Input
                id="fundingKey"
                type="password"
                value={fundingKey}
                onChange={(e) => setFundingKey(e.target.value)}
                placeholder="0x..."
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundingAmount" className="text-xs">
                Amount (USD)
              </Label>
              <Input
                id="fundingAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(Number(e.target.value))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFunding(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleFunding}
                disabled={!fundingKey}
              >
                Fund Account
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {/* Main Action Button */}
        <Button
          onClick={handlePayment}
          disabled={!canPay}
          className="w-full"
          size="lg"
        >
          {isPaymentPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPaymentPending ? 'Processing Payment...' : `Pay $${paymentAmount.toFixed(2)} USDC`}
        </Button>

        {/* Utility Buttons */}
        <div className="flex w-full gap-2">
          {isReady && balanceInUSD < paymentAmount && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFunding(!showFunding)}
              className="flex-1"
            >
              Fund Account
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkBalance(usdcAddress)}
            disabled={!isReady}
            className="flex-1"
          >
            Refresh Balance
          </Button>
          
          {isReady && (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              className="flex-1"
            >
              Disconnect
            </Button>
          )}
        </div>

        {/* Gas-free indicator */}
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            ⛽ Gas fees sponsored by Alchemy
          </Badge>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * Simple payment button for quick payments
 */
interface QuickPayButtonProps {
  publisherAddress: Address
  crawlNFTAddress: Address
  tokenId: bigint
  usdcAddress: Address
  amount: number
  className?: string
  onSuccess?: (txHash: string) => void
  onError?: (error: string) => void
}

export function QuickPayButton({
  publisherAddress,
  crawlNFTAddress,
  tokenId,
  usdcAddress,
  amount,
  className,
  onSuccess,
  onError,
}: QuickPayButtonProps) {
  const { executePayment, isReady, isPaymentPending, initialize, isInitialized } = useAlchemyAAPayment()

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])

  const handleQuickPay = async () => {
    const paymentRequest: PaymentRequest = {
      publisherAddress,
      crawlNFTAddress,
      tokenId,
      amountUSD: amount,
      usdcAddress,
      usePaymentProcessor: false,
    }

    const result = await executePayment(paymentRequest)
    
    if (result?.success && result.hash) {
      onSuccess?.(result.hash)
    } else if (result?.error) {
      onError?.(result.error)
    }
  }

  return (
    <Button
      onClick={handleQuickPay}
      disabled={!isReady || isPaymentPending}
      className={className}
    >
      {isPaymentPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPaymentPending ? 'Paying...' : `Pay $${amount.toFixed(2)}`}
    </Button>
  )
}
