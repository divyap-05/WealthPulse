import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const COOKIE_NAME = 'auth_token';

export const generateToken = (userId, tokenVersion = 0) => {
  return jwt.sign({ id: userId, tokenVersion }, config.jwtSecret, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
};

export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: config.env === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: config.env === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

export const getAuthToken = (req) => {
  // First check httpOnly cookie
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  // Optional fallback for testing tools: Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};
