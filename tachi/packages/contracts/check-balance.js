#!/usr/bin/env node

const { ethers } = require('ethers');

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  const address = '0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d';
  
  console.log('📊 Checking balances for:', address);
  console.log('🎯 This IS your correct wallet address!');
  console.log('');
  
  try {
    // Check ETH balance
    const ethBalance = await provider.getBalance(address);
    const ethFormatted = ethers.formatEther(ethBalance);
    
    // Check USDC balance
    const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    const usdcAbi = ['function balanceOf(address) view returns (uint256)'];
    const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, provider);
    const usdcBalance = await usdcContract.balanceOf(address);
    const usdcFormatted = ethers.formatUnits(usdcBalance, 6);
    
    console.log('💰 ETH Balance:', ethFormatted, 'ETH');
    console.log('💵 USDC Balance:', usdcFormatted, 'USDC');
    console.log('');
    
    // Check requirements
    const ethOk = parseFloat(ethFormatted) >= 0.1;
    const usdcOk = parseFloat(usdcFormatted) >= 1.0;
    
    console.log('📋 Requirements Check:');
    console.log(`${ethOk ? '✅' : '❌'} ETH: ${ethFormatted} ${ethOk ? '≥' : '<'} 0.1 ETH`);
    console.log(`${usdcOk ? '✅' : '❌'} USDC: ${usdcFormatted} ${usdcOk ? '≥' : '<'} 1.0 USDC`);
    console.log('');
    
    if (ethOk && usdcOk) {
      console.log('🎉 SUCCESS! Ready to run: node preflight-check.mjs');
      console.log('Expected result: 12/13 conditions passing (only Wrangler CLI remaining)');
    } else if (usdcOk && !ethOk) {
      const needed = (0.1 - parseFloat(ethFormatted)).toFixed(4);
      console.log(`⚠️  Need ${needed} more ETH to meet requirements`);
    } else {
      console.log('⚠️  Still need more funding');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBalance();
