#!/usr/bin/env node

const { ethers } = require('ethers');

async function checkDeployment() {
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  // Check the transaction that was submitted
  const txHash = '0x27edc63538dd96585ae38439f9fd82b3713e0171715a7605ccf9e537003ca6a2';
  
  console.log('🔍 Checking deployment transaction:', txHash);
  
  try {
    const tx = await provider.getTransaction(txHash);
    console.log('\n📝 Transaction details:');
    console.log('  From:', tx?.from);
    console.log('  To:', tx?.to);
    console.log('  Gas limit:', tx?.gasLimit?.toString());
    console.log('  Gas price:', tx?.gasPrice?.toString(), 'wei');
    console.log('  Value:', ethers.formatEther(tx?.value || 0), 'ETH');
    console.log('  Data length:', tx?.data?.length || 0, 'chars');
    
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log('\n🧾 Transaction receipt:');
    console.log('  Status:', receipt?.status === 1 ? 'SUCCESS' : 'FAILED');
    console.log('  Block number:', receipt?.blockNumber);
    console.log('  Gas used:', receipt?.gasUsed?.toString());
    console.log('  Contract address:', receipt?.contractAddress);
    
    if (receipt?.contractAddress) {
      const code = await provider.getCode(receipt.contractAddress);
      console.log('  Contract code length:', (code.length - 2) / 2, 'bytes');
      
      if (code === '0x') {
        console.log('  ❌ No contract code deployed');
      } else {
        console.log('  ✅ Contract code deployed successfully');
      }
    }
    
    if (receipt?.status === 0) {
      console.log('\n❌ Transaction failed - deployment unsuccessful');
      
      // Try to get revert reason
      try {
        await provider.call(tx, receipt.blockNumber);
      } catch (error) {
        console.log('Revert reason:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking deployment:', error.message);
  }
}

checkDeployment();
