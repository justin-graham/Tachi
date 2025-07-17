import { parseUnits, formatUnits } from 'viem'

/**
 * Utility functions for handling USDC pricing conversions
 */

/**
 * Convert a USD price (as decimal number) to USDC smallest units (wei)
 * @param priceUSD - Price in USD as a decimal number (e.g., 0.005)
 * @returns Price in USDC smallest units (e.g., 5000 for 0.005 USDC)
 */
export function usdToUsdcUnits(priceUSD: number): bigint {
  return parseUnits(priceUSD.toString(), 6) // USDC has 6 decimals
}

/**
 * Convert USDC smallest units (wei) to USD display format
 * @param usdcUnits - Price in USDC smallest units (e.g., 5000)
 * @returns Price in USD as string (e.g., "0.005")
 */
export function usdcUnitsToUsd(usdcUnits: bigint): string {
  return formatUnits(usdcUnits, 6) // USDC has 6 decimals
}

/**
 * Format a USD price for display
 * @param priceUSD - Price in USD as decimal number
 * @returns Formatted price string (e.g., "$0.005 USDC")
 */
export function formatUsdPrice(priceUSD: number): string {
  return `$${priceUSD.toFixed(3)} USDC`
}

/**
 * Validate a USD price input
 * @param priceUSD - Price in USD as decimal number
 * @returns Validation result
 */
export function validateUsdPrice(priceUSD: number): { isValid: boolean; error?: string } {
  if (isNaN(priceUSD) || priceUSD <= 0) {
    return { isValid: false, error: 'Price must be a positive number' }
  }
  
  if (priceUSD < 0.001) {
    return { isValid: false, error: 'Price must be at least $0.001 USDC' }
  }
  
  if (priceUSD > 1.0) {
    return { isValid: false, error: 'Price must not exceed $1.00 USDC' }
  }
  
  return { isValid: true }
}

/**
 * Get recommended pricing information
 */
export function getRecommendedPricing() {
  return {
    min: 0.001,
    max: 1.0,
    recommended: 0.005,
    description: 'Recommended range: $0.001 - $0.01 USDC per crawl. Higher quality content can command premium pricing.'
  }
}

/**
 * Convert price to be embedded in Cloudflare Worker environment variables
 * @param priceUSD - Price in USD as decimal number
 * @returns Object with both formats for easy embedding
 */
export function getPriceForWorker(priceUSD: number) {
  return {
    priceUSD: priceUSD.toString(), // For PRICE_USDC env var
    priceUnits: usdToUsdcUnits(priceUSD).toString(), // For direct use in wei
    formatted: formatUsdPrice(priceUSD)
  }
}
