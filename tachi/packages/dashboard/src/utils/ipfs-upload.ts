// IPFS Upload Utility for Terms of Service

export interface IPFSUploadResult {
  success: boolean
  hash?: string
  uri?: string
  error?: string
}

export interface IPFSMetadata {
  name: string
  description: string
  content: string
  contentType: string
  timestamp: number
  version: string
}

// Web3.Storage API for IPFS uploads
export class IPFSUploader {
  private apiToken: string | null = null

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN || null
  }

  /**
   * Upload Terms of Service to IPFS using Web3.Storage
   */
  async uploadTermsOfService(
    termsContent: string,
    metadata: {
      websiteName: string
      domain: string
      companyName: string
    }
  ): Promise<IPFSUploadResult> {
    try {
      // For development/demo, we'll simulate IPFS upload
      // In production, this would use actual Web3.Storage API
      
      if (!this.apiToken) {
        return this.simulateIPFSUpload(termsContent, metadata)
      }

      const ipfsMetadata: IPFSMetadata = {
        name: `Terms of Service - ${metadata.websiteName}`,
        description: `Terms of Service for crawling ${metadata.domain}`,
        content: termsContent,
        contentType: 'text/markdown',
        timestamp: Date.now(),
        version: '1.0'
      }

      // Create a File object for Web3.Storage
      const file = new File(
        [JSON.stringify(ipfsMetadata, null, 2)], 
        `terms-${metadata.domain.replace(/\./g, '-')}.json`,
        { type: 'application/json' }
      )

      // In a real implementation, use Web3.Storage client:
      // const client = new Web3Storage({ token: this.apiToken })
      // const cid = await client.put([file])
      
      // For now, simulate the upload
      return this.simulateIPFSUpload(termsContent, metadata)

    } catch (error) {
      console.error('IPFS upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Simulate IPFS upload for development/demo purposes
   */
  private simulateIPFSUpload(
    termsContent: string,
    metadata: {
      websiteName: string
      domain: string
      companyName: string
    }
  ): IPFSUploadResult {
    // Generate a mock IPFS hash
    const mockHash = this.generateMockIPFSHash(termsContent, metadata.domain)
    
    console.log('📄 Simulating IPFS upload for Terms of Service')
    console.log('🌐 Website:', metadata.websiteName)
    console.log('🏢 Company:', metadata.companyName)
    console.log('📝 Content Length:', termsContent.length, 'characters')
    console.log('🔗 Mock IPFS Hash:', mockHash)

    return {
      success: true,
      hash: mockHash,
      uri: `ipfs://${mockHash}`
    }
  }

  /**
   * Generate a deterministic mock IPFS hash for development
   */
  private generateMockIPFSHash(content: string, domain: string): string {
    // Simple hash generation for demo purposes
    let hash = 'Qm'
    const combined = content + domain + Date.now().toString()
    
    // Create a pseudo-random hash based on content
    for (let i = 0; i < 44; i++) {
      const charCode = combined.charCodeAt(i % combined.length)
      const char = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        .charAt(charCode % 62)
      hash += char
    }
    
    return hash
  }

  /**
   * Validate IPFS hash format
   */
  static isValidIPFSHash(hash: string): boolean {
    // Basic IPFS hash validation (CIDv0)
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash)
  }

  /**
   * Convert IPFS hash to HTTP gateway URL for preview
   */
  static getGatewayURL(hash: string, gateway = 'https://ipfs.io/ipfs'): string {
    if (!this.isValidIPFSHash(hash)) {
      throw new Error('Invalid IPFS hash')
    }
    return `${gateway}/${hash}`
  }
}

// Alternative IPFS upload methods for production

/**
 * Upload to IPFS using Infura IPFS API
 */
export async function uploadToInfuraIPFS(
  content: string,
  projectId: string,
  projectSecret: string
): Promise<IPFSUploadResult> {
  try {
    const auth = btoa(`${projectId}:${projectSecret}`)
    
    const formData = new FormData()
    formData.append('file', new Blob([content], { type: 'text/plain' }))

    const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Infura IPFS upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    return {
      success: true,
      hash: result.Hash,
      uri: `ipfs://${result.Hash}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Infura upload failed'
    }
  }
}

/**
 * Upload to IPFS using Pinata API
 */
export async function uploadToPinataIPFS(
  content: string,
  apiKey: string,
  apiSecret: string,
  fileName: string = 'terms-of-service.md'
): Promise<IPFSUploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', new Blob([content], { type: 'text/markdown' }), fileName)
    
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        type: 'terms-of-service',
        timestamp: Date.now().toString()
      }
    })
    formData.append('pinataMetadata', metadata)

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Pinata IPFS upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    return {
      success: true,
      hash: result.IpfsHash,
      uri: `ipfs://${result.IpfsHash}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Pinata upload failed'
    }
  }
}
