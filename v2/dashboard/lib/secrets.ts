import {SecretsManagerClient, GetSecretValueCommand} from '@aws-sdk/client-secrets-manager';

// Initialize AWS Secrets Manager client (only in runtime, not during build)
let client: SecretsManagerClient | null = null;

function getClient() {
  if (!client) {
    client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }
  return client;
}

// Cache the private key in memory to avoid repeated AWS API calls
let cachedKey: string | null = null;

/**
 * Retrieve admin private key from AWS Secrets Manager
 * Caches the key in memory after first retrieval
 * @returns Admin private key (with or without 0x prefix)
 */
export async function getAdminPrivateKey(): Promise<string> {
  // Return cached key if available
  if (cachedKey) {
    return cachedKey;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.ADMIN_KEY_SECRET_NAME || 'tachi/admin-private-key'
    });

    const response = await getClient().send(command);

    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }

    // Cache the key for subsequent requests
    cachedKey = response.SecretString;
    return cachedKey;
  } catch (error) {
    console.error('Failed to retrieve admin private key from AWS Secrets Manager:', error);
    throw new Error('Unable to retrieve admin credentials');
  }
}
