import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from './errors.js';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new AppError('JWT_SECRET must be configured with at least 32 characters', 500);
  }

  return crypto.randomBytes(48).toString('hex');
};

const JWT_SECRET = getSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export const signToken = (payload, options = {}) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    audience: 'tachi-crawlers',
    issuer: 'tachi-api',
    ...options
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      audience: 'tachi-crawlers',
      issuer: 'tachi-api'
    });
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};
