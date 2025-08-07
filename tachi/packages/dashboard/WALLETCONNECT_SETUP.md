# WalletConnect Configuration Guide

This guide explains how to set up WalletConnect for the Tachi Protocol dashboard.

## 🔧 Quick Fix for Development

The error you're seeing is because a WalletConnect Cloud project ID is required. I've added a temporary development fallback, but for production you'll need a real project ID.

## 📋 Current Status

✅ **Development fallback added** - The app should work now with a temporary ID  
⚠️  **Production setup needed** - Get a real project ID for production use

## 🚀 Getting Your WalletConnect Project ID

### 1. Create WalletConnect Cloud Account
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in to your account
3. Click **"Create Project"**

### 2. Configure Your Project
1. **Project Name**: `Tachi Protocol`
2. **Project Description**: `Pay-per-crawl web scraping protocol`
3. **Project URL**: `https://mydapp.com` (or your domain)
4. **Project Type**: `dApp`

### 3. Get Your Project ID
1. After creating the project, you'll see your **Project ID**
2. Copy this ID (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 4. Update Environment Variables

Replace the temporary ID in your `.env.local` file:

```env
# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-actual-project-id-here
```

## 🔄 Restart Development Server

After updating the environment variables, restart your development server:

```bash
# Stop the current server (if running)
# Then restart:
npm run dev
```

## 🌐 Production Deployment

For production deployment, make sure to:

1. ✅ Set the real project ID in your production environment
2. ✅ Configure your domain in WalletConnect Cloud
3. ✅ Test wallet connections before going live

## 🔍 Verification

You can verify the configuration is working by:

1. Opening the dashboard at http://localhost:3003
2. Checking the browser console for WalletConnect messages
3. Testing wallet connection functionality

## 📚 Additional Resources

- [WalletConnect Cloud Documentation](https://docs.walletconnect.com/cloud/relay)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs/installation)
- [Wagmi Documentation](https://wagmi.sh/)

---

**Note**: The temporary fallback ID will work for development, but you'll need a real project ID from WalletConnect Cloud for production use.
