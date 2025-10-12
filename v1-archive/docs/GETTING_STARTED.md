# Getting Started with Tachi Protocol

Welcome to Tachi, the decentralized pay-per-crawl protocol that enables content publishers to monetize AI training data while maintaining control over their content.

## Overview

Tachi allows publishers to:
- **Protect their content** from unauthorized AI crawling
- **Monetize AI training data** through micro-payments
- **Maintain control** over who accesses their content
- **Track usage** with transparent on-chain logging

## Quick Start for Publishers

Follow these steps to onboard as a publisher and start monetizing your content:

### Prerequisites

Before you begin, ensure you have:

- [ ] **MetaMask or compatible Web3 wallet** installed
- [ ] **Cloudflare account** (free tier is sufficient)
- [ ] **Base network added to your wallet**
- [ ] **Small amount of ETH on Base** for transaction fees (~$5 worth)
- [ ] **USDC on Base** for initial testing (optional)

> ⚠️ **Important**: Make sure to switch your wallet to **Base network** before starting the onboarding process.

---

## Step 1: Connect Your Wallet

1. **Navigate to the Tachi Dashboard**
   ```
   https://dashboard.tachi.ai
   ```
   *[Screenshot placeholder: Dashboard landing page]*

2. **Click "Connect Wallet"**
   - Select MetaMask or your preferred wallet
   - Approve the connection request
   
   *[Screenshot placeholder: Wallet connection modal]*

3. **Switch to Base Network**
   - If prompted, allow MetaMask to switch to Base network
   - Or manually add Base network with these details:
     ```
     Network Name: Base
     RPC URL: https://mainnet.base.org
     Chain ID: 8453
     Currency Symbol: ETH
     Block Explorer: https://basescan.org
     ```

   *[Screenshot placeholder: Network switching in MetaMask]*

---

## Step 2: Configure Your Website Details

1. **Enter Your Domain**
   - Input your website domain (e.g., `myblog.com`)
   - Do not include `http://` or `https://`
   
   *[Screenshot placeholder: Domain input field]*

2. **Customize Terms of Service**
   - Review the default terms for AI crawlers
   - Modify the terms if needed for your specific use case
   - These terms will be stored on IPFS and linked to your license NFT
   
   *[Screenshot placeholder: Terms of service editor]*

   **Default terms include:**
   - Payment requirements for AI crawling
   - Usage restrictions and guidelines
   - Contact information for disputes

---

## Step 3: Set Your Pricing

1. **Configure Price Per Crawl**
   - Recommended range: **$0.001 - $0.01 USDC** per request
   - Consider your content value and target audience
   - Popular sites typically charge $0.005 per crawl
   
   *[Screenshot placeholder: Pricing configuration]*

2. **Pricing Guidelines**
   - **High-value content**: $0.01+ (research papers, premium articles)
   - **Standard content**: $0.003-$0.007 (blog posts, news articles)
   - **High-volume sites**: $0.001-$0.003 (forums, social content)

> 💡 **Tip**: You can always update your pricing later by modifying your Cloudflare Worker configuration.

---

## Step 4: Mint Your License NFT

1. **Review License Details**
   - Verify your domain and terms are correct
   - Check the preview of your license NFT metadata
   
   *[Screenshot placeholder: License preview]*

2. **Execute the Mint Transaction**
   - Click "Mint License NFT"
   - Approve the transaction in your wallet
   - Wait for transaction confirmation (~2-5 seconds on Base)
   
   *[Screenshot placeholder: Transaction confirmation]*

3. **License NFT Created**
   - Your license NFT is now minted and stored in your wallet
   - This NFT serves as your official publisher license
   - Token ID will be displayed (remember this number)
   
   *[Screenshot placeholder: Successful NFT mint confirmation]*

---

## Step 5: Deploy Your Cloudflare Gateway

1. **Download Generated Script**
   - The dashboard generates a customized Cloudflare Worker script
   - Click "Download Worker Script" to save the file
   - The script includes your specific domain, pricing, and license details
   
   *[Screenshot placeholder: Download script button]*

2. **Log in to Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com
   ```
   - Navigate to "Workers & Pages"
   - Click "Create Application" > "Create Worker"
   
   *[Screenshot placeholder: Cloudflare Workers dashboard]*

3. **Deploy Your Worker**
   - Replace the default code with your downloaded script
   - Click "Save and Deploy"
   - Note the worker URL (e.g., `publisher-gateway.your-subdomain.workers.dev`)
   
   *[Screenshot placeholder: Worker code editor]*

4. **Configure Custom Domain (Optional)**
   - Go to "Settings" > "Triggers" in your worker
   - Add a custom domain or route pattern
   - Example: `yourdomain.com/*` to protect your entire site
   
   *[Screenshot placeholder: Custom domain configuration]*

---

## Step 6: Test Your Setup

1. **Verify Protection is Active**
   - Use an AI crawler user-agent to test your site:
   ```bash
   curl -H "User-Agent: GPTBot/1.0" https://yourdomain.com/test
   ```
   - Should return HTTP 402 with payment instructions
   
   *[Screenshot placeholder: 402 payment required response]*

2. **Test Regular Traffic**
   - Normal browser requests should pass through unaffected
   - Your website should load normally for human visitors
   
3. **Monitor Crawl Attempts**
   - Check Cloudflare Analytics for AI crawler detection
   - Monitor payment requests in your wallet

---

## Environment Setup

### Base Network Configuration

**Mainnet (Production):**
```
Network: Base
Chain ID: 8453
RPC URL: https://mainnet.base.org
USDC Address: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

**Sepolia Testnet (Testing):**
```
Network: Base Sepolia
Chain ID: 84532
RPC URL: https://sepolia.base.org
USDC Address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Required Cloudflare Account Permissions

- Workers deployment access
- Custom domain configuration (if using)
- Analytics access for monitoring

---

## Important Notes & Tips

### 🔒 **Security Best Practices**

- **Never share your private keys** - Tachi only requires your public wallet address
- **Use a dedicated wallet** for protocol operations if desired
- **Keep your Cloudflare account secure** with 2FA enabled
- **Monitor worker logs** for suspicious activity

### 💰 **Payment Processing**

- **Payments are made in USDC** on Base network
- **Transaction fees are low** (~$0.01) thanks to Base's efficiency
- **Payments are automatic** - no manual intervention required
- **Revenue is transparent** - all payments are visible on-chain

### 🤖 **AI Crawler Support**

The gateway automatically detects these AI crawlers:
- OpenAI (GPTBot, ChatGPT)
- Anthropic (Claude)
- Google (Bard, Gemini)
- Microsoft (Bing AI)
- Meta (LLaMA crawlers)
- Perplexity, You.com, and others

### 🔧 **Troubleshooting**

**Common Issues:**

1. **"Insufficient funds" error**
   - Ensure you have ETH for gas fees on Base network
   - Check your wallet is connected to Base, not Ethereum mainnet

2. **"Transaction failed" during NFT mint**
   - Verify you're on Base network
   - Try increasing gas price slightly
   - Ensure contract addresses are correct

3. **Cloudflare Worker not detecting crawlers**
   - Check worker logs in Cloudflare dashboard
   - Verify the script was deployed correctly
   - Test with proper AI crawler user-agents

4. **Payments not being detected**
   - Confirm USDC contract address is correct for your network
   - Check transaction hash format in authorization header
   - Verify payment amount matches your configured price

### 📊 **Monitoring & Analytics**

After deployment, you can monitor:
- **Crawler activity** in Cloudflare Analytics
- **Payment transactions** on Base blockchain explorer
- **Revenue tracking** through your wallet
- **Worker performance** in Cloudflare dashboard

---

## Next Steps

Once your setup is complete:

1. **Share your experience** - Help other publishers by sharing feedback
2. **Join the community** - Connect with other publishers and developers
3. **Explore advanced features** - Custom pricing models, analytics integrations
4. **Scale your protection** - Apply to multiple domains or websites

### Advanced Configuration

For enterprise publishers or advanced use cases:

- **Multi-domain setup** - Protect multiple websites with one license
- **Custom payment processing** - Integrate with existing billing systems
- **Analytics integration** - Connect to Google Analytics or other platforms
- **API access** - Programmatic monitoring and management

---

## Support & Resources

### Documentation
- [Publisher Integration Guide](./PUBLISHER_INTEGRATION.md)
- [AI Integration Guide](./AI_INTEGRATION.md)
- [Cloudflare Deployment Guide](../packages/gateway-cloudflare/README.md)
- [Smart Contract Documentation](../packages/contracts/docs/)

### Community
- Discord: [Join our community](#)
- GitHub: [Tachi Protocol Repository](https://github.com/tachi-protocol/tachi)
- Twitter: [@TachiProtocol](#)

### Technical Support
- Create an issue on [GitHub](https://github.com/tachi-protocol/tachi/issues)
- Check [troubleshooting guide](./TROUBLESHOOTING.md)
- Review [frequently asked questions](./FAQ.md)

---

**Congratulations! 🎉** You've successfully onboarded to the Tachi Protocol and can now monetize your content through AI crawler payments while maintaining full control over access to your website.