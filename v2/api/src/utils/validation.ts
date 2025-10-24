/**
 * Input validation utilities (no external dependencies)
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate domain name
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
}

/**
 * Validate price (positive number)
 */
export function isValidPrice(price: any): boolean {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0 && num <= 1000;
}

/**
 * Validate transaction hash
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate publisher registration
 */
export function validatePublisherRegistration(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.domain || typeof data.domain !== 'string') {
    errors.push({field: 'domain', message: 'Domain is required'});
  } else if (!isValidDomain(data.domain)) {
    errors.push({field: 'domain', message: 'Invalid domain format'});
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push({field: 'name', message: 'Name is required'});
  } else if (data.name.length < 2 || data.name.length > 100) {
    errors.push({field: 'name', message: 'Name must be 2-100 characters'});
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push({field: 'email', message: 'Email is required'});
  } else if (!isValidEmail(data.email)) {
    errors.push({field: 'email', message: 'Invalid email format'});
  }

  if (!data.walletAddress || typeof data.walletAddress !== 'string') {
    errors.push({field: 'walletAddress', message: 'Wallet address is required'});
  } else if (!isValidAddress(data.walletAddress)) {
    errors.push({field: 'walletAddress', message: 'Invalid Ethereum address'});
  }

  if (data.pricePerRequest !== undefined && !isValidPrice(data.pricePerRequest)) {
    errors.push({field: 'pricePerRequest', message: 'Invalid price (must be 0-1000)'});
  }

  return {valid: errors.length === 0, errors};
}

/**
 * Validate crawler registration
 */
export function validateCrawlerRegistration(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.name || typeof data.name !== 'string') {
    errors.push({field: 'name', message: 'Name is required'});
  } else if (data.name.length < 2 || data.name.length > 100) {
    errors.push({field: 'name', message: 'Name must be 2-100 characters'});
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push({field: 'email', message: 'Email is required'});
  } else if (!isValidEmail(data.email)) {
    errors.push({field: 'email', message: 'Invalid email format'});
  }

  if (!data.walletAddress || typeof data.walletAddress !== 'string') {
    errors.push({field: 'walletAddress', message: 'Wallet address is required'});
  } else if (!isValidAddress(data.walletAddress)) {
    errors.push({field: 'walletAddress', message: 'Invalid Ethereum address'});
  }

  return {valid: errors.length === 0, errors};
}

/**
 * Validate payment log
 */
export function validatePaymentLog(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.txHash || typeof data.txHash !== 'string') {
    errors.push({field: 'txHash', message: 'Transaction hash is required'});
  } else if (!isValidTxHash(data.txHash)) {
    errors.push({field: 'txHash', message: 'Invalid transaction hash format'});
  }

  if (!data.crawlerAddress || !isValidAddress(data.crawlerAddress)) {
    errors.push({field: 'crawlerAddress', message: 'Invalid crawler address'});
  }

  if (!data.publisherAddress || !isValidAddress(data.publisherAddress)) {
    errors.push({field: 'publisherAddress', message: 'Invalid publisher address'});
  }

  if (!data.amount || !isValidPrice(data.amount)) {
    errors.push({field: 'amount', message: 'Invalid amount'});
  }

  return {valid: errors.length === 0, errors};
}

/**
 * Validate publisher update
 */
export function validatePublisherUpdate(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (data.name && (typeof data.name !== 'string' || data.name.length < 2 || data.name.length > 100)) {
    errors.push({field: 'name', message: 'Name must be 2-100 characters'});
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push({field: 'email', message: 'Invalid email format'});
  }

  if (data.pricePerRequest !== undefined && !isValidPrice(data.pricePerRequest)) {
    errors.push({field: 'pricePerRequest', message: 'Invalid price (must be 0-1000)'});
  }

  return {valid: errors.length === 0, errors};
}
