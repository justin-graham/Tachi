import { ethers } from 'ethers';

export default async function handler(req, res) {
  try {
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const start = Date.now();
    const latestBlock = await provider.getBlockNumber();
    const responseTime = Date.now() - start;
    
    const network = await provider.getNetwork();
    
    res.status(200).json({
      rpc_status: 'connected',
      latest_block: latestBlock,
      response_time_ms: responseTime,
      network: {
        name: network.name,
        chainId: Number(network.chainId)
      }
    });
  } catch (error) {
    res.status(500).json({
      rpc_status: 'error',
      error: error.message
    });
  }
}
