import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { getAuthToken } from '../utils/token.js';

export const protect = async (req, res, next) => {
  try {
    const token = getAuthToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });

    // Find user
    const user = await User.findById(decoded.id).select('+authTokenVersion');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    if ((decoded.tokenVersion ?? 0) !== user.authTokenVersion) {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

export const blockDemoWrites = (req, res, next) => {
  if (req.user?.isDemo && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      success: false,
      message: 'Demo account data is read-only.',
    });
  }
  next();
};
