import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  ProtocolStats
} from "../generated/schema"

export function getOrCreateProtocolStats(): ProtocolStats {
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
    protocolStats.totalPublishers = BigInt.fromI32(0)
    protocolStats.totalLicenses = BigInt.fromI32(0)
    protocolStats.lastUpdatedAt = BigInt.fromI32(0)
  }
  return protocolStats
}
