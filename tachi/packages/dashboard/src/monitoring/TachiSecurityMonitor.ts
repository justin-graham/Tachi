import { ethers } from "ethers";
import { createHash } from "crypto";
import axios from "axios";

/**
 * Production Security Monitoring System for Tachi Protocol
 * 
 * Features:
 * - Real-time contract monitoring
 * - Multi-signature transaction tracking
 * - Security incident detection
 * - Automated alerting via multiple channels
 * - Performance metrics collection
 */

interface SecurityAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  description: string;
  contractAddress: string;
  transactionHash?: string;
  timestamp: number;
  metadata: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
}

interface MonitoringConfig {
  networks: {
    base: {
      rpcUrl: string;
      contracts: {
        multiSig: string;
        crawlNFT: string;
        paymentProcessor: string;
        proofOfCrawlLedger: string;
      };
    };
  };
  alerting: {
    slack: {
      token: string;
      channels: {
        critical: string;
        security: string;
        operations: string;
      };
    };
    pagerduty: {
      integrationKey: string;
    };
    sentry: {
      dsn: string;
    };
    email: {
      smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
      };
      recipients: {
        critical: string[];
        security: string[];
        operations: string[];
      };
    };
  };
  monitoring: {
    intervalMs: number;
    gasThresholds: {
      warning: number;
      critical: number;
    };
    responseTimeThresholds: {
      warning: number;
      critical: number;
    };
  };
}

// Dynamic optional deps (Slack / Sentry) with safe fallbacks
let SlackClient: any = class { constructor(_: any) {} chat = { postMessage: async () => {} }; };
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const slackMod = require("@slack/web-api");
  SlackClient = slackMod.WebClient || SlackClient;
} catch {
  // fallback stub already defined
}
let Sentry: any = { init: () => {}, captureException: () => {}, captureMessage: () => {} };
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require("@sentry/node");
} catch {
  // fallback stub
}

export class TachiSecurityMonitor {
  private config: MonitoringConfig;
  private provider: ethers.JsonRpcProvider;
  private slack: any; // dynamic client (SlackClient or fallback)
  private isMonitoring: boolean = false;
  private alertHistory: Map<string, SecurityAlert> = new Map();
  private metricsBuffer: PerformanceMetric[] = [];

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.networks.base.rpcUrl);
    this.slack = new SlackClient(config.alerting.slack.token);
    
    // Initialize Sentry for error tracking if available
    if (Sentry && typeof Sentry.init === 'function') {
      Sentry.init({
        dsn: config.alerting.sentry.dsn,
        environment: "production",
        tracesSampleRate: 1.0,
      });
    }
  }

  /**
   * Start the monitoring system
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log("🔍 Monitor already running");
      return;
    }

    console.log("🚀 Starting Tachi Security Monitor...");
    this.isMonitoring = true;

    // Start contract event monitoring
    this.startEventMonitoring();
    
    // Start periodic health checks
    this.startHealthChecks();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Send startup notification
    await this.sendAlert({
      id: this.generateAlertId(),
      severity: "medium",
      type: "system_startup",
      description: "Tachi Security Monitor started successfully",
      contractAddress: "system",
      timestamp: Date.now(),
      metadata: {
        version: "1.0.0",
        environment: "production"
      }
    });

    console.log("✅ Tachi Security Monitor started successfully");
  }

  /**
   * Stop the monitoring system
   */
  async stopMonitoring(): Promise<void> {
    console.log("🛑 Stopping Tachi Security Monitor...");
    this.isMonitoring = false;

    // Send shutdown notification
    await this.sendAlert({
      id: this.generateAlertId(),
      severity: "medium", 
      type: "system_shutdown",
      description: "Tachi Security Monitor stopped",
      contractAddress: "system",
      timestamp: Date.now(),
      metadata: {}
    });
  }

  /**
   * Monitor contract events in real-time
   */
  private startEventMonitoring(): void {
    const contracts = this.config.networks.base.contracts;

    // Monitor Multi-Sig events
    this.monitorMultiSigEvents(contracts.multiSig);
    
    // Monitor contract ownership changes
    this.monitorOwnershipChanges([
      contracts.crawlNFT,
      contracts.paymentProcessor,
      contracts.proofOfCrawlLedger
    ]);
    
    // Monitor payment transactions
    this.monitorPaymentEvents(contracts.paymentProcessor);
    
    // Monitor NFT minting activity
    this.monitorNFTEvents(contracts.crawlNFT);
  }

  /**
   * Monitor multi-signature wallet events
   */
  private async monitorMultiSigEvents(multiSigAddress: string): Promise<void> {
    try {
      const multiSigContract = new ethers.Contract(
        multiSigAddress,
        [
          "event TransactionSubmitted(uint256 indexed txId, address indexed submitter, address indexed to, uint256 value, bytes data)",
          "event TransactionConfirmed(uint256 indexed txId, address indexed owner, uint256 confirmationCount)",
          "event TransactionExecuted(uint256 indexed txId, address indexed executor, bool success, bytes returnData)",
          "event EmergencyActionExecuted(uint256 indexed txId, address indexed executor, string reason)",
          "event OwnerAdded(address indexed owner, uint256 timestamp)",
          "event OwnerRemoved(address indexed owner, uint256 timestamp)"
        ],
        this.provider
      );

      // Monitor transaction submissions
      multiSigContract.on("TransactionSubmitted", async (txId, submitter, to, value, data, event) => {
        const alert: SecurityAlert = {
          id: this.generateAlertId(),
          severity: "medium",
          type: "multisig_transaction_submitted",
          description: `Multi-sig transaction ${txId} submitted by ${submitter}`,
          contractAddress: multiSigAddress,
          transactionHash: event.transactionHash,
          timestamp: Date.now(),
          metadata: {
            txId: txId.toString(),
            submitter,
            to,
            value: value.toString(),
            blockNumber: event.blockNumber
          }
        };

        await this.sendAlert(alert);
        this.recordMetric({
          name: "multisig_transaction_submitted",
          value: 1,
          unit: "count",
          timestamp: Date.now(),
          tags: { submitter, contract: multiSigAddress }
        });
      });

      // Monitor emergency actions
      multiSigContract.on("EmergencyActionExecuted", async (txId, executor, reason, event) => {
        const alert: SecurityAlert = {
          id: this.generateAlertId(),
          severity: "critical",
          type: "emergency_action",
          description: `EMERGENCY: ${reason} executed by ${executor}`,
          contractAddress: multiSigAddress,
          transactionHash: event.transactionHash,
          timestamp: Date.now(),
          metadata: {
            txId: txId.toString(),
            executor,
            reason,
            blockNumber: event.blockNumber
          }
        };

        await this.sendAlert(alert);
        
        // Also trigger PagerDuty for emergency actions
        await this.triggerPagerDutyIncident(alert);
      });

      // Monitor owner changes
      multiSigContract.on("OwnerAdded", async (owner, timestamp, event) => {
        const alert: SecurityAlert = {
          id: this.generateAlertId(),
          severity: "high",
          type: "multisig_owner_added",
          description: `New multi-sig owner added: ${owner}`,
          contractAddress: multiSigAddress,
          transactionHash: event.transactionHash,
          timestamp: Date.now(),
          metadata: {
            newOwner: owner,
            addedAt: timestamp.toString(),
            blockNumber: event.blockNumber
          }
        };

        await this.sendAlert(alert);
      });

    } catch (error) {
      console.error("❌ Error setting up multi-sig monitoring:", error);
      Sentry.captureException(error);
    }
  }

  /**
   * Monitor ownership changes across contracts
   */
  private async monitorOwnershipChanges(contractAddresses: string[]): Promise<void> {
    const ownershipABI = [
      "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
    ];

    for (const address of contractAddresses) {
      try {
        const contract = new ethers.Contract(address, ownershipABI, this.provider);
        
        contract.on("OwnershipTransferred", async (previousOwner, newOwner, event) => {
          const severity = newOwner === this.config.networks.base.contracts.multiSig ? "medium" : "critical";
          
          const alert: SecurityAlert = {
            id: this.generateAlertId(),
            severity,
            type: "ownership_transfer",
            description: `Ownership transferred from ${previousOwner} to ${newOwner}`,
            contractAddress: address,
            transactionHash: event.transactionHash,
            timestamp: Date.now(),
            metadata: {
              previousOwner,
              newOwner,
              blockNumber: event.blockNumber,
              expectedOwner: this.config.networks.base.contracts.multiSig
            }
          };

          await this.sendAlert(alert);

          // Trigger critical incident if ownership goes to unexpected address
          if (severity === "critical") {
            await this.triggerPagerDutyIncident(alert);
          }
        });

      } catch (error) {
        console.error(`❌ Error monitoring ownership for ${address}:`, error);
        Sentry.captureException(error);
      }
    }
  }

  /**
   * Monitor payment processor events
   */
  private async monitorPaymentEvents(paymentProcessorAddress: string): Promise<void> {
    try {
      const paymentContract = new ethers.Contract(
        paymentProcessorAddress,
        [
          "event Payment(address indexed from, address indexed publisher, uint256 amount, string reason)",
          "event Paused(address account)",
          "event Unpaused(address account)"
        ],
        this.provider
      );

      // Monitor large payments
      paymentContract.on("Payment", async (from, publisher, amount, reason, event) => {
        const amountUSDC = parseFloat(ethers.formatUnits(amount, 6));
        
        if (amountUSDC > 500) { // Alert on payments > 500 USDC
          const alert: SecurityAlert = {
            id: this.generateAlertId(),
            severity: amountUSDC > 1000 ? "high" : "medium",
            type: "large_payment",
            description: `Large payment: ${amountUSDC} USDC from ${from} to ${publisher}`,
            contractAddress: paymentProcessorAddress,
            transactionHash: event.transactionHash,
            timestamp: Date.now(),
            metadata: {
              from,
              publisher,
              amount: amountUSDC,
              reason,
              blockNumber: event.blockNumber
            }
          };

          await this.sendAlert(alert);
        }

        // Record payment metrics
        this.recordMetric({
          name: "payment_amount",
          value: amountUSDC,
          unit: "USDC",
          timestamp: Date.now(),
          tags: { from, publisher }
        });
      });

      // Monitor pause/unpause events
      paymentContract.on("Paused", async (account, event) => {
        const alert: SecurityAlert = {
          id: this.generateAlertId(),
          severity: "high",
          type: "contract_paused",
          description: `PaymentProcessor paused by ${account}`,
          contractAddress: paymentProcessorAddress,
          transactionHash: event.transactionHash,
          timestamp: Date.now(),
          metadata: {
            pausedBy: account,
            blockNumber: event.blockNumber
          }
        };

        await this.sendAlert(alert);
      });

    } catch (error) {
      console.error("❌ Error monitoring payment events:", error);
      Sentry.captureException(error);
    }
  }

  /**
   * Monitor NFT events
   */
  private async monitorNFTEvents(crawlNFTAddress: string): Promise<void> {
    try {
      const nftContract = new ethers.Contract(
        crawlNFTAddress,
        [
          "event LicenseMinted(address indexed publisher, uint256 indexed tokenId, string termsURI)",
          "event LicenseBurned(uint256 indexed tokenId, address indexed publisher)"
        ],
        this.provider
      );

      // Monitor license minting
      nftContract.on("LicenseMinted", async (publisher, tokenId, termsURI, event) => {
        this.recordMetric({
          name: "license_minted",
          value: 1,
          unit: "count",
          timestamp: Date.now(),
          tags: { publisher, contract: crawlNFTAddress }
        });

        // Log for transparency
        console.log(`📜 License minted: Token ${tokenId} for ${publisher}`);
      });

    } catch (error) {
      console.error("❌ Error monitoring NFT events:", error);
      Sentry.captureException(error);
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error("❌ Health check failed:", error);
        Sentry.captureException(error);
      }
    }, this.config.monitoring.intervalMs);
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    const contracts = this.config.networks.base.contracts;

    try {
      // Check RPC connectivity
      const blockNumber = await this.provider.getBlockNumber();
      const responseTime = Date.now() - startTime;

      // Record RPC performance
      this.recordMetric({
        name: "rpc_response_time",
        value: responseTime,
        unit: "ms",
        timestamp: Date.now(),
        tags: { endpoint: "getBlockNumber" }
      });

      // Alert on slow RPC responses
      if (responseTime > this.config.monitoring.responseTimeThresholds.critical) {
        await this.sendAlert({
          id: this.generateAlertId(),
          severity: "high",
          type: "slow_rpc_response",
          description: `RPC response time: ${responseTime}ms (threshold: ${this.config.monitoring.responseTimeThresholds.critical}ms)`,
          contractAddress: "rpc",
          timestamp: Date.now(),
          metadata: { responseTime, blockNumber }
        });
      }

      // Check gas prices
      const feeData = await this.provider.getFeeData();
      if (feeData.gasPrice) {
        const gasPriceGwei = parseFloat(ethers.formatUnits(feeData.gasPrice, "gwei"));
        
        this.recordMetric({
          name: "gas_price",
          value: gasPriceGwei,
          unit: "gwei",
          timestamp: Date.now(),
          tags: { network: "base" }
        });

        // Alert on high gas prices
        if (gasPriceGwei > this.config.monitoring.gasThresholds.critical) {
          await this.sendAlert({
            id: this.generateAlertId(),
            severity: "medium",
            type: "high_gas_price",
            description: `High gas price: ${gasPriceGwei} gwei`,
            contractAddress: "network",
            timestamp: Date.now(),
            metadata: { gasPrice: gasPriceGwei }
          });
        }
      }

      // Check multi-sig health
      await this.checkMultiSigHealth(contracts.multiSig);

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      await this.sendAlert({
        id: this.generateAlertId(),
        severity: "critical",
        type: "health_check_failure",
        description: `Health check failed: ${errMsg}`,
        contractAddress: "system",
        timestamp: Date.now(),
        metadata: { error: errMsg }
      });

      throw error;
    }
  }

  /**
   * Check multi-sig wallet health
   */
  private async checkMultiSigHealth(multiSigAddress: string): Promise<void> {
    try {
      const multiSigContract = new ethers.Contract(
        multiSigAddress,
        [
          "function threshold() view returns (uint256)",
          "function getOwners() view returns (address[])",
          "function transactionCount() view returns (uint256)"
        ],
        this.provider
      );

      const [threshold, owners, transactionCount] = await Promise.all([
        multiSigContract.threshold(),
        multiSigContract.getOwners(),
        multiSigContract.transactionCount()
      ]);

      // Verify expected configuration
      const expectedThreshold = 3;
      const expectedOwners = 5;

      if (threshold !== expectedThreshold) {
        await this.sendAlert({
          id: this.generateAlertId(),
          severity: "critical",
          type: "multisig_threshold_changed",
          description: `Multi-sig threshold changed from ${expectedThreshold} to ${threshold}`,
          contractAddress: multiSigAddress,
          timestamp: Date.now(),
          metadata: { actualThreshold: threshold, expectedThreshold }
        });
      }

      if (owners.length !== expectedOwners) {
        await this.sendAlert({
          id: this.generateAlertId(),
          severity: "critical", 
          type: "multisig_owners_changed",
          description: `Multi-sig owners count changed from ${expectedOwners} to ${owners.length}`,
          contractAddress: multiSigAddress,
          timestamp: Date.now(),
          metadata: { actualOwners: owners.length, expectedOwners, owners }
        });
      }

      // Record metrics
      this.recordMetric({
        name: "multisig_threshold",
        value: Number(threshold),
        unit: "count",
        timestamp: Date.now(),
        tags: { contract: multiSigAddress }
      });

      this.recordMetric({
        name: "multisig_owner_count",
        value: owners.length,
        unit: "count", 
        timestamp: Date.now(),
        tags: { contract: multiSigAddress }
      });

    } catch (error) {
      console.error("❌ Multi-sig health check failed:", error);
      throw error;
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor memory usage
    setInterval(() => {
      if (!this.isMonitoring) return;

      const memUsage = process.memoryUsage();
      this.recordMetric({
        name: "memory_usage",
        value: memUsage.rss / 1024 / 1024, // MB
        unit: "MB",
        timestamp: Date.now(),
        tags: { type: "rss" }
      });

      this.recordMetric({
        name: "memory_usage", 
        value: memUsage.heapUsed / 1024 / 1024, // MB
        unit: "MB",
        timestamp: Date.now(),
        tags: { type: "heap" }
      });
    }, 30000); // Every 30 seconds

    // Flush metrics buffer periodically
    setInterval(() => {
      this.flushMetrics();
    }, 60000); // Every minute
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metricsBuffer.push(metric);
    
    // Prevent buffer overflow
    if (this.metricsBuffer.length > 1000) {
      this.metricsBuffer = this.metricsBuffer.slice(-500);
    }
  }

  /**
   * Flush metrics to external systems
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      // Send metrics to monitoring service (e.g., Datadog, CloudWatch, etc.)
      // This is a placeholder - implement based on your monitoring stack
      console.log(`📊 Flushing ${this.metricsBuffer.length} metrics`);
      
      // Example: Send to custom metrics endpoint
      if (process.env.METRICS_ENDPOINT) {
        await axios.post(process.env.METRICS_ENDPOINT, {
          metrics: this.metricsBuffer,
          timestamp: Date.now()
        });
      }

      // Clear buffer after successful flush
      this.metricsBuffer = [];

    } catch (error) {
      console.error("❌ Failed to flush metrics:", error);
      Sentry.captureException(error);
    }
  }

  /**
   * Send alert via multiple channels
   */
  private async sendAlert(alert: SecurityAlert): Promise<void> {
    // Prevent duplicate alerts
    const alertKey = `${alert.type}_${alert.contractAddress}`;
    const lastAlert = this.alertHistory.get(alertKey);
    
    if (lastAlert && (Date.now() - lastAlert.timestamp < 300000)) { // 5 minute cooldown
      return;
    }

    this.alertHistory.set(alertKey, alert);

    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.description}`);

    try {
      // Send to Slack
      await this.sendSlackAlert(alert);
      
      // Send to Sentry
      this.sendSentryAlert(alert);
      
      // Send email for critical alerts
      if (alert.severity === "critical") {
        await this.sendEmailAlert(alert);
      }

    } catch (error) {
      console.error("❌ Failed to send alert:", error);
      Sentry.captureException(error);
    }
  }

  /**
   * Send alert to Slack
   */
  private async sendSlackAlert(alert: SecurityAlert): Promise<void> {
    const channelMap = {
      critical: this.config.alerting.slack.channels.critical,
      high: this.config.alerting.slack.channels.security,
      medium: this.config.alerting.slack.channels.operations,
      low: this.config.alerting.slack.channels.operations
    };

    const channel = channelMap[alert.severity];
    const emoji = {
      critical: "🚨",
      high: "⚠️",
      medium: "ℹ️", 
      low: "📝"
    };

    const color = {
      critical: "#FF0000",
      high: "#FF8C00",
      medium: "#FFD700",
      low: "#32CD32"
    };

    try {
      await this.slack.chat.postMessage({
        channel,
        text: `${emoji[alert.severity]} ${alert.description}`,
        attachments: [{
          color: color[alert.severity],
          title: `${alert.type.toUpperCase()} Alert`,
          fields: [
            {
              title: "Severity",
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: "Contract",
              value: alert.contractAddress,
              short: true
            },
            {
              title: "Transaction",
              value: alert.transactionHash || "N/A",
              short: true
            },
            {
              title: "Time",
              value: new Date(alert.timestamp).toISOString(),
              short: true
            }
          ],
          footer: "Tachi Protocol Security Monitor",
          ts: Math.floor(alert.timestamp / 1000)
        }]
      });

    } catch (error) {
      console.error("❌ Failed to send Slack alert:", error);
    }
  }

  /**
   * Send alert to Sentry
   */
  private sendSentryAlert(alert: SecurityAlert): void {
    Sentry.captureMessage(alert.description, {
      level: alert.severity === "critical" ? "error" : "warning",
      tags: {
        alertType: alert.type,
        contractAddress: alert.contractAddress,
        severity: alert.severity
      },
      extra: alert.metadata
    });
  }

  /**
   * Send email alert for critical issues
   */
  private async sendEmailAlert(alert: SecurityAlert): Promise<void> {
    // Implement email sending based on your SMTP configuration
    // This is a placeholder for email functionality
    console.log(`📧 Would send email alert: ${alert.description}`);
  }

  /**
   * Trigger PagerDuty incident for critical alerts
   */
  private async triggerPagerDutyIncident(alert: SecurityAlert): Promise<void> {
    try {
      await axios.post("https://events.pagerduty.com/v2/enqueue", {
        routing_key: this.config.alerting.pagerduty.integrationKey,
        event_action: "trigger",
        payload: {
          summary: alert.description,
          severity: alert.severity,
          source: "tachi-security-monitor",
          component: alert.contractAddress,
          group: alert.type,
          class: "security",
          custom_details: alert.metadata
        }
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      console.log("📟 PagerDuty incident triggered");

    } catch (error) {
      console.error("❌ Failed to trigger PagerDuty incident:", error);
    }
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return createHash("sha256")
      .update(`${Date.now()}_${Math.random()}`)
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * Get monitoring statistics
   */
  public getStats(): object {
    return {
      isMonitoring: this.isMonitoring,
      alertsGenerated: this.alertHistory.size,
      metricsBuffered: this.metricsBuffer.length,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }
}
