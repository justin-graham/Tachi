# Tachi Protocol - Incident Response Procedures

## 🚨 Emergency Response Guide

### Critical Incident Classification

#### **SEVERITY 1: CRITICAL** 🔴
- **Definition**: System compromise, funds at risk, complete service outage
- **Response Time**: < 5 minutes
- **Escalation**: Immediate PagerDuty alert + CEO/CTO notification
- **Examples**:
  - Unauthorized multi-sig transactions
  - Smart contract exploit detected
  - Private key compromise suspected
  - Complete system outage

#### **SEVERITY 2: HIGH** 🟠
- **Definition**: Service degradation, security concerns, partial outage
- **Response Time**: < 15 minutes
- **Escalation**: Slack alerts + Security Officer notification
- **Examples**:
  - Multi-sig owner changes
  - High gas prices affecting operations
  - Contract ownership transfers
  - Performance degradation

#### **SEVERITY 3: MEDIUM** 🟡
- **Definition**: Non-critical issues, monitoring alerts
- **Response Time**: < 1 hour
- **Escalation**: Standard monitoring notifications
- **Examples**:
  - Large transactions
  - System performance metrics
  - Operational alerts

#### **SEVERITY 4: LOW** 🟢
- **Definition**: Informational, routine operations
- **Response Time**: < 4 hours
- **Escalation**: Log entries only
- **Examples**:
  - License minting
  - Routine transactions
  - System updates

---

## 📞 Emergency Contacts

### **Immediate Response Team**
| Role | Name | Primary Contact | Secondary Contact |
|------|------|----------------|-------------------|
| CEO | [Name] | +1-XXX-XXX-XXXX | email@domain.com |
| CTO | [Name] | +1-XXX-XXX-XXXX | email@domain.com |
| Security Officer | [Name] | +1-XXX-XXX-XXXX | email@domain.com |
| Operations Lead | [Name] | +1-XXX-XXX-XXXX | email@domain.com |

### **Support Contacts**
- **PagerDuty**: Integration Key in .env.production
- **Slack**: #tachi-critical, #tachi-security, #tachi-ops
- **Email Distribution**: security@tachi.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX (24/7)

---

## 🛡️ Critical Incident Response Playbook

### **Step 1: Immediate Assessment (< 2 minutes)**

1. **Acknowledge the Alert**
   ```bash
   # Check monitoring dashboard
   curl http://localhost:3001/api/health
   
   # Verify system status
   curl http://localhost:3001/api/dashboard
   ```

2. **Assess Severity**
   - Review alert details and metadata
   - Check transaction hashes on block explorer
   - Verify contract states

3. **Initiate Response**
   - Document incident start time
   - Begin incident log
   - Notify appropriate team members

### **Step 2: Containment (< 5 minutes)**

#### **For Contract Security Issues:**
1. **Emergency Pause** (if available)
   ```solidity
   // Using hardware wallet via multi-sig
   TachiProductionMultiSig.emergencyAction(
     TARGET_CONTRACT_ADDRESS,
     0,
     PAUSE_FUNCTION_DATA,
     "Emergency pause due to security incident"
   )
   ```

2. **Block Suspicious Addresses**
   - Document all suspicious transactions
   - Prepare blacklist updates if necessary

3. **Secure Communication**
   - Use secure channels only
   - Avoid public discussion of vulnerabilities

#### **For Infrastructure Issues:**
1. **Isolate Affected Systems**
   ```bash
   # Stop monitoring if compromised
   pm2 stop tachi-monitoring
   
   # Check for unauthorized access
   tail -f /var/log/auth.log
   ```

2. **Backup Critical Data**
   ```bash
   # Backup current state
   mkdir -p /backup/incident-$(date +%Y%m%d-%H%M%S)
   cp -r /app/data /backup/incident-$(date +%Y%m%d-%H%M%S)/
   ```

### **Step 3: Investigation (< 15 minutes)**

1. **Gather Evidence**
   - Export all relevant logs
   - Screenshot monitoring dashboards
   - Collect transaction evidence

2. **Root Cause Analysis**
   ```bash
   # Check system logs
   journalctl -u tachi-monitoring --since "30 minutes ago"
   
   # Analyze transaction patterns
   grep "CRITICAL\|HIGH" /var/log/tachi/monitoring.log
   ```

3. **Document Findings**
   - Create incident report template
   - Record timeline of events
   - Identify attack vectors

### **Step 4: Communication**

#### **Internal Communication**
1. **Incident Status Update Template**
   ```
   🚨 INCIDENT UPDATE - [SEVERITY] 
   
   Status: INVESTIGATING / CONTAINED / RESOLVED
   Impact: [Description of impact]
   ETA: [Expected resolution time]
   Actions: [Current actions being taken]
   Next Update: [Time]
   
   Team: [Response team members]
   ```

2. **Stakeholder Notification**
   - Multi-sig signers: Immediate
   - Development team: < 15 minutes
   - External auditors: If security-related
   - Legal team: If potential liability

#### **External Communication**
1. **User Communication Template**
   ```
   🛠️ Service Notice
   
   We are currently investigating a technical issue affecting [SERVICE].
   User funds remain secure. We will provide updates every 30 minutes.
   
   Status Page: https://status.tachi.com
   Support: support@tachi.com
   ```

### **Step 5: Resolution**

#### **Technical Resolution Steps**
1. **Deploy Fixes**
   ```bash
   # Test fix on development environment first
   npm run test:fix
   
   # Deploy via multi-sig governance
   npm run deploy:emergency-fix
   ```

2. **Verify Resolution**
   ```bash
   # Run comprehensive health checks
   npm run health:full-check
   
   # Verify all systems operational
   curl http://localhost:3001/api/health
   ```

#### **Recovery Validation**
1. **System Health Verification**
   - All monitoring systems green
   - Contract functions operational
   - Multi-sig functionality confirmed

2. **User Impact Assessment**
   - Verify no user funds affected
   - Check all user operations work
   - Confirm data integrity

---

## 📋 Incident Response Checklists

### **Critical Security Incident Checklist**
- [ ] Alert acknowledged within 2 minutes
- [ ] Severity assessed and documented
- [ ] Emergency contacts notified
- [ ] Affected systems identified
- [ ] Immediate containment actions taken
- [ ] Evidence collection started
- [ ] Communication plan activated
- [ ] Technical team assembled
- [ ] External stakeholders notified (if required)
- [ ] Post-incident review scheduled

### **Infrastructure Incident Checklist**
- [ ] System status verified
- [ ] Service impact assessed
- [ ] Backup systems activated (if needed)
- [ ] User communication sent
- [ ] Fix development started
- [ ] Testing completed
- [ ] Deployment authorized
- [ ] Service restoration verified
- [ ] Performance monitoring confirmed

### **Multi-Sig Emergency Checklist**
- [ ] Hardware wallets secured and available
- [ ] Required signers contacted and available
- [ ] Emergency transaction prepared
- [ ] Multi-sig threshold confirmed (3/5)
- [ ] Transaction broadcast coordinated
- [ ] Confirmation monitoring active
- [ ] Success verification completed
- [ ] Documentation updated

---

## 🔧 Monitoring Command Center

### **Real-Time Monitoring Commands**
```bash
# Start comprehensive monitoring
npm run monitoring:start

# Check system health
curl -s http://localhost:3001/api/health | jq

# View active alerts
curl -s http://localhost:3001/api/alerts | jq

# Get performance metrics
curl -s "http://localhost:3001/api/metrics?metric=network_response_time&samples=20" | jq

# Emergency monitoring restart
pm2 restart tachi-monitoring --update-env
```

### **Log Analysis Commands**
```bash
# Real-time log monitoring
tail -f /var/log/tachi/security.log | grep -E "(CRITICAL|HIGH)"

# Search for specific incidents
grep -r "emergency_action" /var/log/tachi/ --include="*.log"

# Analyze transaction patterns
awk '/Payment/ {count++} END {print "Payments in last hour:", count}' /var/log/tachi/contracts.log

# Check multi-sig activity
grep "multisig" /var/log/tachi/monitoring.log | tail -10
```

### **Network Monitoring**
```bash
# Check RPC endpoint health
curl -X POST -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     $BASE_RPC_URL

# Monitor gas prices
curl -s "https://api.basescan.org/api?module=gastracker&action=gasoracle" | jq

# Check contract states
cast call $MULTISIG_ADDRESS "threshold()" --rpc-url $BASE_RPC_URL
```

---

## 📊 Incident Metrics and KPIs

### **Response Time Targets**
- **Detection Time**: < 1 minute (automated)
- **Response Time**: < 5 minutes (critical), < 15 minutes (high)
- **Resolution Time**: < 30 minutes (critical), < 2 hours (high)
- **Communication Time**: < 10 minutes (internal), < 30 minutes (external)

### **Success Metrics**
- Mean Time to Detection (MTTD): Target < 60 seconds
- Mean Time to Response (MTTR): Target < 5 minutes
- Mean Time to Resolution (MTTR): Target < 30 minutes
- Incident Escalation Rate: Target < 5%

### **Quality Metrics**
- False Positive Rate: Target < 10%
- Alert Accuracy: Target > 95%
- Incident Recurrence: Target < 2%
- Documentation Completeness: Target 100%

---

## 📚 Training and Drills

### **Monthly Incident Response Drills**
1. **Week 1**: Multi-sig emergency transaction drill
2. **Week 2**: Contract security incident simulation
3. **Week 3**: Infrastructure failure response
4. **Week 4**: Communication and escalation drill

### **Training Requirements**
- All team members: Basic incident response (4 hours)
- Technical staff: Advanced technical response (8 hours)
- Multi-sig signers: Hardware wallet emergency procedures (2 hours)
- Management: Communication and legal procedures (2 hours)

### **Drill Scenarios**
1. **Scenario A**: Suspicious multi-sig transaction detected
2. **Scenario B**: Smart contract vulnerability reported
3. **Scenario C**: RPC endpoint failure during high traffic
4. **Scenario D**: Hardware wallet signer unavailable
5. **Scenario E**: Social engineering attack attempt

---

## 🔍 Post-Incident Procedures

### **Immediate Post-Incident (< 2 hours)**
1. **Incident Resolution Confirmation**
   - All systems operational
   - User impact resolved
   - Monitoring systems active

2. **Stakeholder Notification**
   - Internal teams updated
   - Users informed of resolution
   - External partners notified

### **Post-Incident Review (< 24 hours)**
1. **Incident Report Creation**
   - Timeline documentation
   - Root cause analysis
   - Impact assessment
   - Response effectiveness

2. **Lessons Learned Session**
   - What worked well?
   - What could be improved?
   - Process gaps identified
   - Training needs assessment

### **Follow-Up Actions (< 1 week)**
1. **Process Improvements**
   - Update response procedures
   - Enhance monitoring rules
   - Improve alerting logic
   - Strengthen preventive controls

2. **System Hardening**
   - Address identified vulnerabilities
   - Implement additional safeguards
   - Update security configurations
   - Enhance monitoring coverage

---

## 📞 24/7 Emergency Procedures

### **After-Hours Response**
1. **On-Call Rotation**: 24/7 coverage by security team
2. **Escalation Path**: On-call → Security Officer → CTO → CEO
3. **Response SLA**: Critical incidents within 15 minutes
4. **Remote Access**: Secure VPN + MFA required

### **Weekend/Holiday Procedures**
- Reduced staff but full monitoring coverage
- Emergency contact list updated monthly
- Backup communication channels ready
- External support vendors on standby

---

*This document is reviewed monthly and updated after each incident. Last updated: [Date]*
*Version: 1.0 | Document Owner: Security Team | Next Review: [Date]*
