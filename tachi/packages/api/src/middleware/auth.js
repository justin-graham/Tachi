import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.crawlerId || decoded.publisherId,
      type: decoded.type,
      role: decoded.role || 'crawler'
    };
    
    logger.debug(`Authenticated user: ${req.user.id} (${req.user.type})`);
    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const generateToken = (userId, type = 'individual', role = 'crawler') => {
  const payload = role === 'crawler' 
    ? { crawlerId: userId, type, role }
    : { publisherId: userId, type, role };
    
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};
