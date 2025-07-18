# Page snapshot

```yaml
- alert
- main:
  - heading "Welcome to Tachi" [level=3]
  - paragraph: Set up your pay-per-crawl website in just a few steps
  - img
  - text: Connect Wallet Connect your Ethereum wallet
  - img
  - text: Site Details Configure your website details
  - img
  - text: Pricing Setup Set your crawl pricing
  - img
  - text: Create License Mint your CrawlNFT license
  - img
  - text: Deploy Worker Deploy your Cloudflare Worker
  - tabpanel:
    - img
    - heading "Connect Your Wallet" [level=3]
    - paragraph: Connect your Ethereum wallet to get started with Tachi. You'll need to be on the Base Sepolia network.
    - text: "Connection Status: Not Connected"
    - button "Connect Wallet"
    - heading "Getting Started:" [level=4]
    - list:
      - listitem: • Click "Connect Wallet" to open the wallet selection modal
      - listitem: • Choose your preferred wallet (MetaMask, WalletConnect, etc.)
      - listitem: • Approve the connection in your wallet
      - listitem: • Switch to Base Sepolia network if prompted
```