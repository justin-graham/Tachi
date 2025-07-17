"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, Info, Calculator } from 'lucide-react'
import { validateUsdPrice, usdToUsdcUnits, formatUsdPrice, getRecommendedPricing, getPriceForWorker } from '@/utils/pricing'

interface PricingStepProps {
  onComplete: (data: { pricePerCrawl: number; priceUnits: string; workerConfig: any }) => void
  isComplete: boolean
}

export function PricingStep({ onComplete, isComplete }: PricingStepProps) {
  const [pricePerCrawl, setPricePerCrawl] = useState('0.005')
  const [errors, setErrors] = useState<string>('')
  const recommended = getRecommendedPricing()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(pricePerCrawl)
    
    const validation = validateUsdPrice(price)
    if (!validation.isValid) {
      setErrors(validation.error || 'Invalid price')
      return
    }
    
    setErrors('')
    const workerConfig = getPriceForWorker(price)
    
    onComplete({ 
      pricePerCrawl: price,
      priceUnits: workerConfig.priceUnits,
      workerConfig
    })
  }

  if (isComplete) {
    const price = parseFloat(pricePerCrawl)
    const unitsValue = usdToUsdcUnits(price)
    
    return (
      <Card className="w-full max-w-md mx-auto border-green-200">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">✅ Pricing Configured</CardTitle>
          <CardDescription>
            Price set to {formatUsdPrice(price)} per crawl
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Calculator className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-xs text-green-700">
                <p className="font-medium">Conversion Details</p>
                <p>USDC Units: {unitsValue.toString()} (for smart contracts)</p>
                <p>Worker Config: ${price} USDC</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <DollarSign className="h-5 w-5" />
          Set Pricing
        </CardTitle>
        <CardDescription>
          Configure how much to charge for each crawl request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price per Crawl (USDC)</Label>
            <Input
              id="price"
              type="number"
              step="0.001"
              min={recommended.min}
              max={recommended.max}
              value={pricePerCrawl}
              onChange={(e) => setPricePerCrawl(e.target.value)}
              placeholder={recommended.recommended.toString()}
              className={errors ? 'border-red-500' : ''}
            />
            {errors && (
              <p className="text-xs text-red-600">{errors}</p>
            )}
          </div>
          
          {/* Conversion Preview */}
          {pricePerCrawl && !errors && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Calculator className="h-4 w-4 text-purple-600 mt-0.5" />
                <div className="text-xs text-purple-700">
                  <p className="font-medium">Conversion Preview</p>
                  <p>USDC Units: {usdToUsdcUnits(parseFloat(pricePerCrawl) || 0).toString()}</p>
                  <p>For Cloudflare Worker: "{pricePerCrawl}" USDC</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Recommended Range</p>
                <p>{recommended.description}</p>
                <p className="mt-1 font-medium">Default: {formatUsdPrice(recommended.recommended)}</p>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!!errors}>
            Set Pricing
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
