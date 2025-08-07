import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  CrawlRequested,
  FeesWithdrawn,
  ProtocolFeesWithdrawn,
  BaseCrawlFeeUpdated,
  ProtocolFeePercentUpdated,
  FeeRecipientUpdated
} from "../generated/PaymentProcessorUpgradeable/PaymentProcessorUpgradeable"
import {
  CrawlEvent,
  Payment,
  Publisher,
  License,
  ProtocolStats
} from "../generated/schema"

export function handleCrawlRequested(event: CrawlRequested): void {
  // Load or create publisher
  let publisher = Publisher.load(event.params.publisher)
  if (publisher == null) {
    publisher = new Publisher(event.params.publisher)
    publisher.totalEarnings = BigInt.fromI32(0)
    publisher.totalCrawls = BigInt.fromI32(0)
    publisher.createdAt = event.block.timestamp
    publisher.updatedAt = event.block.timestamp
  }

  // Load license
  let tokenIdBytes = Bytes.fromByteArray(Bytes.fromBigInt(event.params.tokenId))
  let license = License.load(tokenIdBytes)
  
  if (license == null) {
    return
  }

  // Create crawl event
  let crawlEventId = event.transaction.hash.concatI32(event.logIndex.toI32())
  let crawlEvent = new CrawlEvent(crawlEventId)
  crawlEvent.requester = event.params.requester
  crawlEvent.publisher = publisher.id
  crawlEvent.license = license.id
  crawlEvent.tokenId = event.params.tokenId
  crawlEvent.amount = event.params.amount
  crawlEvent.protocolFee = event.params.protocolFee
  crawlEvent.netAmount = event.params.amount.minus(event.params.protocolFee)
  crawlEvent.targetUrl = event.params.targetUrl
  crawlEvent.timestamp = event.block.timestamp
  crawlEvent.blockNumber = event.block.number
  crawlEvent.transactionHash = event.transaction.hash
  crawlEvent.save()

  // Create payment record
  let paymentId = event.transaction.hash.concatI32(event.logIndex.toI32() + 1000)
  let payment = new Payment(paymentId)
  payment.type = "CRAWL_PAYMENT"
  payment.account = event.params.requester
  payment.amount = event.params.amount
  payment.crawlEvent = crawlEvent.id
  payment.license = license.id
  payment.timestamp = event.block.timestamp
  payment.blockNumber = event.block.number
  payment.transactionHash = event.transaction.hash
  payment.save()

  // Update publisher stats
  let netAmount = event.params.amount.minus(event.params.protocolFee)
  publisher.totalEarnings = publisher.totalEarnings.plus(netAmount)
  publisher.totalCrawls = publisher.totalCrawls.plus(BigInt.fromI32(1))
  publisher.lastCrawlAt = event.block.timestamp
  publisher.updatedAt = event.block.timestamp
  publisher.save()

  // Update license stats
  license.totalEarnings = license.totalEarnings.plus(netAmount)
  license.totalCrawls = license.totalCrawls.plus(BigInt.fromI32(1))
  license.lastCrawlAt = event.block.timestamp
  license.save()

  // Update protocol stats
  let protocolStats = ProtocolStats.load(Bytes.fromUTF8("1"))
  if (protocolStats == null) {
    protocolStats = new ProtocolStats(Bytes.fromUTF8("1"))
    protocolStats.totalVolume = BigInt.fromI32(0)
    protocolStats.totalCrawls = BigInt.fromI32(0)
    protocolStats.totalProtocolFees = BigInt.fromI32(0)
    protocolStats.totalProtocolFeesWithdrawn = BigInt.fromI32(0)
    protocolStats.baseCrawlFee = BigInt.fromI32(0)
    protocolStats.protocolFeePercent = BigInt.fromI32(0)
    protocolStats.feeRecipient = Bytes.fromI32(0)
    protocolStats.totalLicenses = BigInt.fromI32(0)
    protocolStats.totalPublishers = BigInt.fromI32(0)
    protocolStats.lastUpdatedAt = event.block.timestamp
  }
  protocolStats.totalVolume = protocolStats.totalVolume.plus(event.params.amount)
  protocolStats.totalCrawls = protocolStats.totalCrawls.plus(BigInt.fromI32(1))
  protocolStats.totalProtocolFees = protocolStats.totalProtocolFees.plus(event.params.protocolFee)
  protocolStats.lastUpdatedAt = event.block.timestamp
  protocolStats.save()
}

export function handleFeesWithdrawn(event: FeesWithdrawn): void {
  // Create payment record for withdrawal
  let paymentId = event.transaction.hash.concatI32(event.logIndex.toI32())
  let payment = new Payment(paymentId)
  payment.type = "FEE_WITHDRAWAL"
  payment.account = event.params.publisher
  payment.amount = event.params.amount
  payment.timestamp = event.block.timestamp
  payment.blockNumber = event.block.number
  payment.transactionHash = event.transaction.hash
  payment.save()

  // Update publisher
  let publisher = Publisher.load(event.params.publisher)
  if (publisher != null) {
    publisher.updatedAt = event.block.timestamp
    publisher.save()
  }
}

export function handleProtocolFeesWithdrawn(event: ProtocolFeesWithdrawn): void {
  let protocolStats = ProtocolStats.load(Bytes.fromUTF8("1"))
  if (protocolStats != null) {
    protocolStats.lastUpdatedAt = event.block.timestamp
    protocolStats.save()
  }
}

export function handleBaseCrawlFeeUpdated(event: BaseCrawlFeeUpdated): void {
  let protocolStats = ProtocolStats.load(Bytes.fromUTF8("1"))
  if (protocolStats != null) {
    protocolStats.lastUpdatedAt = event.block.timestamp
    protocolStats.save()
  }
}

export function handleProtocolFeePercentUpdated(event: ProtocolFeePercentUpdated): void {
  let protocolStats = ProtocolStats.load(Bytes.fromUTF8("1"))
  if (protocolStats != null) {
    protocolStats.lastUpdatedAt = event.block.timestamp
    protocolStats.save()
  }
}

export function handleFeeRecipientUpdated(event: FeeRecipientUpdated): void {
  let protocolStats = ProtocolStats.load(Bytes.fromUTF8("1"))
  if (protocolStats != null) {
    protocolStats.lastUpdatedAt = event.block.timestamp
    protocolStats.save()
  }
}
