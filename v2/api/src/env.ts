import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from root .env file (v2/.env)
dotenv.config({path: path.resolve(__dirname, '../../.env')});

// Export environment variables for type safety
export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  PORT: process.env.PORT || '3001',
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  BASE_RPC_URL: process.env.BASE_RPC_URL,
  CRAWL_NFT_ADDRESS: process.env.CRAWL_NFT_ADDRESS,
  PAYMENT_PROCESSOR_ADDRESS: process.env.PAYMENT_PROCESSOR_ADDRESS,
  PROOF_OF_CRAWL_ADDRESS: process.env.PROOF_OF_CRAWL_ADDRESS,
} as const;
