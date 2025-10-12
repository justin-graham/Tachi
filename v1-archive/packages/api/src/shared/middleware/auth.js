import { verifyToken } from '../auth.js';
import { AppError } from '../errors.js';

export const requireAuth = (req, _res, next) => {
  const header = req.get('authorization');

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Authorization header missing', 401);
  }

  const token = header.slice('Bearer '.length).trim();
  const payload = verifyToken(token);

  req.user = {
    id: payload.sub,
    role: payload.role,
    crawlerId: payload.crawlerId || null
  };

  next();
};
