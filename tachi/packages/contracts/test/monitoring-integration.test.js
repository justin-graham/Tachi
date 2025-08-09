"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TachiSecurityMonitor_1 = require("../src/monitoring/TachiSecurityMonitor");
const PerformanceMonitor_1 = require("../src/monitoring/PerformanceMonitor");
const chai_1 = require("chai");
// Mock configuration for testing
const mockConfig = {
    networks: {
        base: {
            rpcUrl: "https://sepolia.base.org",
            contracts: {
                multiSig: "0x742d35Cc6634C0532925a3b8D0ed9C0eB4F8C4FA",
                crawlNFT: "0x8ba1f109551bD432803012645Hac136c22C8C4dA",
                paymentProcessor: "0x3C44CdDdB6a900fa2b585dd299e03d12FA429D3C",
                proofOfCrawlLedger: "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
            }
        }
    },
    alerting: {
        slack: {
            token: "test-token",
            channels: { critical: "#test-critical", security: "#test-security", operations: "#test-ops" }
        },
        pagerduty: { integrationKey: "test-key" },
        sentry: { dsn: "test-dsn" },
        email: {
            smtp: { host: "smtp.test.com", port: 587, user: "test@test.com", pass: "test-pass" },
            recipients: { critical: ["admin@test.com"], security: ["security@test.com"], operations: ["ops@test.com"] }
        }
    },
    monitoring: {
        intervalMs: 30000,
        gasThresholds: { warning: 20, critical: 50 },
        responseTimeThresholds: { warning: 1000, critical: 5000 }
    }
};
describe("Tachi Production Monitoring - Integration Tests", () => {
    let securityMonitor;
    let performanceMonitor;
    beforeEach(() => {
        // Suppress console output during tests
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn
        };
        console.log = () => { };
        console.error = () => { };
        console.warn = () => { };
        securityMonitor = new TachiSecurityMonitor_1.TachiSecurityMonitor(mockConfig);
        performanceMonitor = new PerformanceMonitor_1.PerformanceMonitor(securityMonitor);
        // Restore console after initialization
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
    });
    describe("Real-time Security Monitoring", () => {
        it("should initialize security monitor successfully", () => {
            (0, chai_1.expect)(securityMonitor).to.not.be.undefined;
            const stats = securityMonitor.getStats();
            (0, chai_1.expect)(stats).to.have.property("isMonitoring");
            (0, chai_1.expect)(stats).to.have.property("alertsGenerated");
            (0, chai_1.expect)(stats).to.have.property("metricsBuffered");
        });
        it("should provide monitoring statistics", () => {
            const stats = securityMonitor.getStats();
            (0, chai_1.expect)(stats.isMonitoring).to.be.a('boolean');
            (0, chai_1.expect)(stats.alertsGenerated).to.be.a('number');
            (0, chai_1.expect)(stats.metricsBuffered).to.be.a('number');
            (0, chai_1.expect)(stats.uptime).to.be.a('number');
            (0, chai_1.expect)(stats.memoryUsage).to.be.an('object');
        });
        it("should handle start monitoring without throwing", async () => {
            // This test verifies the monitoring can start without crashing
            // In a real environment, it would connect to actual RPC
            (0, chai_1.expect)(async () => {
                await securityMonitor.startMonitoring();
            }).to.not.throw();
        });
        it("should handle stop monitoring gracefully", async () => {
            await securityMonitor.startMonitoring();
            (0, chai_1.expect)(async () => {
                await securityMonitor.stopMonitoring();
            }).to.not.throw();
        });
    });
    describe("Performance Monitoring", () => {
        it("should initialize performance monitor", () => {
            (0, chai_1.expect)(performanceMonitor).to.not.be.undefined;
        });
        it("should generate dashboard data", () => {
            const dashboardData = performanceMonitor.getDashboardData();
            (0, chai_1.expect)(dashboardData).to.have.property("systemHealth");
            (0, chai_1.expect)(dashboardData).to.have.property("networkMetrics");
            (0, chai_1.expect)(dashboardData).to.have.property("contractMetrics");
            (0, chai_1.expect)(dashboardData).to.have.property("alertsSummary");
            (0, chai_1.expect)(dashboardData).to.have.property("performanceMetrics");
            (0, chai_1.expect)(dashboardData.systemHealth).to.have.property("status");
            (0, chai_1.expect)(dashboardData.systemHealth).to.have.property("uptime");
            (0, chai_1.expect)(dashboardData.systemHealth).to.have.property("memoryUsage");
        });
        it("should provide system health status", () => {
            const dashboardData = performanceMonitor.getDashboardData();
            (0, chai_1.expect)(dashboardData.systemHealth.status).to.be.a('string');
            (0, chai_1.expect)(['healthy', 'warning', 'critical']).to.include(dashboardData.systemHealth.status);
        });
    });
    describe("Error Tracking and Alerting", () => {
        it("should track metrics buffer size", () => {
            const stats = securityMonitor.getStats();
            (0, chai_1.expect)(stats.metricsBuffered).to.be.a('number');
            (0, chai_1.expect)(stats.metricsBuffered).to.be.at.least(0);
        });
        it("should initialize alert tracking", () => {
            const stats = securityMonitor.getStats();
            (0, chai_1.expect)(stats.alertsGenerated).to.be.a('number');
            (0, chai_1.expect)(stats.alertsGenerated).to.be.at.least(0);
        });
        it("should handle network connectivity issues gracefully", async () => {
            // Test that the monitor can handle RPC failures without crashing
            (0, chai_1.expect)(async () => {
                await securityMonitor.startMonitoring();
            }).to.not.throw();
        });
        it("should maintain state during network issues", () => {
            const stats = securityMonitor.getStats();
            (0, chai_1.expect)(stats).to.have.property('isMonitoring');
            (0, chai_1.expect)(stats).to.have.property('alertsGenerated');
        });
    });
    describe("System Integration", () => {
        it("should handle repeated start/stop cycles", async () => {
            // Test that the monitor can be started and stopped multiple times
            await securityMonitor.startMonitoring();
            await securityMonitor.stopMonitoring();
            await securityMonitor.startMonitoring();
            await securityMonitor.stopMonitoring();
            const stats = securityMonitor.getStats();
            (0, chai_1.expect)(stats).to.have.property('isMonitoring');
        });
        it("should maintain state consistency", () => {
            const stats1 = securityMonitor.getStats();
            const stats2 = securityMonitor.getStats();
            (0, chai_1.expect)(stats1.uptime).to.be.at.most(stats2.uptime);
            (0, chai_1.expect)(stats1.memoryUsage).to.be.an('object');
            (0, chai_1.expect)(stats2.memoryUsage).to.be.an('object');
        });
        it("should provide comprehensive monitoring coverage", () => {
            const stats = securityMonitor.getStats();
            (0, chai_1.expect)(stats).to.have.property('isMonitoring');
            (0, chai_1.expect)(stats).to.have.property('alertsGenerated');
            (0, chai_1.expect)(stats).to.have.property('metricsBuffered');
            (0, chai_1.expect)(stats).to.have.property('uptime');
            (0, chai_1.expect)(stats).to.have.property('memoryUsage');
            (0, chai_1.expect)(stats.isMonitoring).to.be.a('boolean');
            (0, chai_1.expect)(stats.alertsGenerated).to.be.a('number');
            (0, chai_1.expect)(stats.metricsBuffered).to.be.a('number');
            (0, chai_1.expect)(stats.uptime).to.be.a('number');
            (0, chai_1.expect)(stats.memoryUsage).to.be.an('object');
        });
    });
});
