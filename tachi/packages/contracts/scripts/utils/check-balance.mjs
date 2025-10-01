import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

const address = '0x56544De43641F06cc5a601eD0B0C7e028727211b';
const balance = await client.getBalance({ address });
console.log('New crawler balance:', formatEther(balance), 'ETH');
