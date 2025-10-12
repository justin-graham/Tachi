import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  LicenseMinted,
  Transfer,
  BaseURIUpdated
} from "../generated/CrawlNFTUpgradeable/CrawlNFTUpgradeable"
import {
  Publisher,
  License,
  ProtocolStats
} from "../generated/schema"
import { 
  getOrCreateProtocolStats
} from "./helpers"

export function handleLicenseMinted(event: LicenseMinted): void {
  // Load or create publisher
  let publisher = Publisher.load(event.params.publisher)
  if (publisher == null) {
    publisher = new Publisher(event.params.publisher)
    publisher.totalEarnings = BigInt.fromI32(0)
    publisher.totalCrawls = BigInt.fromI32(0)
    publisher.createdAt = event.block.timestamp
    publisher.updatedAt = event.block.timestamp
  }
  
  let protocolStats = getOrCreateProtocolStats()
  
  // Create license entity
  let license = new License(Bytes.fromByteArray(Bytes.fromBigInt(event.params.tokenId)))
  license.tokenId = event.params.tokenId
  license.publisher = publisher.id
  license.domain = event.params.domain
  license.tokenURI = ""
  license.totalEarnings = BigInt.fromI32(0)
  license.totalCrawls = BigInt.fromI32(0)
  license.averageEarningPerCrawl = BigInt.fromI32(0).toBigDecimal()
  license.mintedAt = event.block.timestamp
  license.mintedAtBlock = event.block.number
  license.mintedTxHash = event.transaction.hash
  license.lastCrawlAt = null
  license.isActive = true
  license.save()

  // Update publisher
  publisher.updatedAt = event.block.timestamp
  publisher.save()

  // Update protocol stats
  protocolStats.totalLicenses = protocolStats.totalLicenses.plus(BigInt.fromI32(1))
  protocolStats.lastUpdatedAt = event.block.timestamp
  protocolStats.save()
}

export function handleTransfer(event: Transfer): void {
  let license = License.load(Bytes.fromByteArray(Bytes.fromBigInt(event.params.tokenId)))
  if (license != null) {
    // License transferred - could update publisher if needed
    if (event.params.to != event.params.from) {
      license.save()
    }
  }
}

export function handleBaseURIUpdated(event: BaseURIUpdated): void {
  // Update protocol stats to track this change
  let protocolStats = getOrCreateProtocolStats()
  protocolStats.lastUpdatedAt = event.block.timestamp
  protocolStats.save()
}
