// Terms of Service Template Generator

export interface TermsTemplateData {
  companyName: string
  websiteName: string
  domain: string
  contactEmail: string
  lastUpdated: Date
}

export function generateDefaultTermsOfService(data: TermsTemplateData): string {
  const formattedDate = data.lastUpdated.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `# Terms of Service for Web Crawling

**Effective Date:** ${formattedDate}
**Company:** ${data.companyName}
**Website:** ${data.websiteName} (${data.domain})
**Contact:** ${data.contactEmail}

## 1. Acceptance of Terms

By accessing and crawling content from ${data.domain}, you ("Crawler", "You") agree to be bound by these Terms of Service ("Terms"). These Terms constitute a legally binding agreement between you and ${data.companyName} ("Company", "We", "Us").

## 2. Permitted Crawling Activities

### 2.1 Scope of Permission
You are granted permission to crawl publicly accessible content from ${data.domain} subject to the following conditions:

- **Rate Limiting:** Maximum of 1 request per second per IP address
- **User-Agent:** Must identify your crawler with a descriptive User-Agent string
- **Respect robots.txt:** Must comply with directives in /robots.txt
- **Business Hours:** Crawling is permitted 24/7 unless otherwise specified

### 2.2 Permitted Use Cases
- Academic research and analysis
- Search engine indexing
- Price monitoring and comparison
- Content aggregation for personal use
- Data analysis for business intelligence

## 3. Prohibited Activities

You may NOT:
- Overwhelm our servers with excessive requests
- Crawl private or restricted content
- Use crawled data for spam or malicious purposes
- Resell or redistribute crawled content without permission
- Bypass security measures or access controls
- Impersonate other users or services

## 4. Payment and Access

### 4.1 Pay-Per-Crawl Model
Access to ${data.domain} content is provided on a pay-per-crawl basis through the Tachi Protocol:

- **Payment Required:** Each crawl request requires payment via smart contract
- **Pricing:** As specified in the CrawlNFT contract
- **Blockchain:** Payments processed on Base network
- **No Refunds:** All payments are final and non-refundable

### 4.2 Wallet Connection
You must connect a valid Ethereum wallet to access crawling services.

## 5. Data Usage and Privacy

### 5.1 Content Ownership
All content on ${data.domain} remains the property of ${data.companyName}. Crawling permission does not transfer ownership rights.

### 5.2 Attribution
When using crawled content, you must:
- Provide attribution to ${data.domain}
- Include a link back to the original source
- Respect any copyright notices

### 5.3 Data Retention
You may store crawled data for legitimate research and analysis purposes but must:
- Delete data upon our request
- Not store sensitive or personal information
- Comply with applicable privacy laws

## 6. Technical Requirements

### 6.1 Crawler Identification
Your crawler must:
- Use a descriptive User-Agent string
- Include contact information in requests
- Implement proper error handling

### 6.2 Server Compliance
- Respect HTTP status codes (especially 429, 503)
- Implement exponential backoff for retries
- Handle redirects appropriately

## 7. Monitoring and Enforcement

We reserve the right to:
- Monitor crawling activity
- Block or rate-limit excessive requests
- Terminate access for violations
- Update these terms at any time

## 8. Liability and Disclaimers

### 8.1 Service Availability
${data.domain} is provided "as is" without warranties. We do not guarantee:
- Continuous availability
- Data accuracy or completeness
- Fitness for any particular purpose

### 8.2 Limitation of Liability
${data.companyName} shall not be liable for:
- Direct or indirect damages from crawling activities
- Loss of data or business interruption
- Third-party actions or content

## 9. Intellectual Property

### 9.1 Copyright Protection
All content on ${data.domain} is protected by copyright and other intellectual property laws.

### 9.2 Fair Use
Crawling for research, analysis, or indexing may constitute fair use under applicable copyright law.

## 10. Termination

### 10.1 Termination by Us
We may terminate your crawling access immediately for:
- Violation of these Terms
- Excessive server load
- Suspicious or malicious activity

### 10.2 Effect of Termination
Upon termination:
- All crawling permissions cease immediately
- You must delete any stored crawled data
- Payment obligations remain in effect

## 11. Updates to Terms

We may update these Terms at any time by:
- Posting revised Terms on ${data.domain}
- Updating the IPFS hash in our smart contract
- Providing 30 days notice for material changes

## 12. Governing Law

These Terms are governed by the laws of [Jurisdiction] without regard to conflict of law principles.

## 13. Contact Information

For questions about these Terms or crawling permissions:

**${data.companyName}**
Email: ${data.contactEmail}
Website: https://${data.domain}

## 14. Smart Contract Integration

These Terms are integrated with the Tachi Protocol smart contract system:
- **Payment Processing:** Via CrawlNFT contract
- **Access Control:** Enforced on-chain
- **Terms Storage:** This document stored on IPFS
- **Updates:** Reflected in smart contract termsURI

By proceeding with payment through the smart contract, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.

---

**Last Updated:** ${formattedDate}
**Version:** 1.0
**IPFS Hash:** [To be generated upon upload]`
}

export function validateTermsContent(terms: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check minimum length
  if (terms.length < 500) {
    errors.push('Terms of Service must be at least 500 characters long')
  }

  // Check for required sections
  const requiredSections = [
    'Terms of Service',
    'Acceptance of Terms',
    'Permitted',
    'Prohibited',
    'Payment',
    'Liability'
  ]

  requiredSections.forEach(section => {
    if (!terms.toLowerCase().includes(section.toLowerCase())) {
      warnings.push(`Consider including a "${section}" section`)
    }
  })

  // Check for contact information
  if (!terms.includes('@') || !terms.includes('.com')) {
    warnings.push('Terms should include contact email address')
  }

  // Check for date
  const currentYear = new Date().getFullYear().toString()
  if (!terms.includes(currentYear)) {
    warnings.push('Terms should include current date/year')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
