import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const COOKIE_NAME = 'auth_token';
const DEMO_COOKIE_NAME = 'demo_auth_token';

const cookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: config.env === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const clearCookieOptions = {
  httpOnly: cookieOptions.httpOnly,
  secure: cookieOptions.secure,
  sameSite: cookieOptions.sameSite,
  path: cookieOptions.path,
};

export const generateToken = (userId, tokenVersion = 0) => {
  return jwt.sign({ id: userId, tokenVersion }, config.jwtSecret, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
};

export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.clearCookie(DEMO_COOKIE_NAME, clearCookieOptions);
};

export const setDemoAuthCookie = (res, token) => {
  res.cookie(DEMO_COOKIE_NAME, token, cookieOptions);
};

export const clearAuthCookie = (res, req) => {
  if (req?.cookies?.[DEMO_COOKIE_NAME]) {
    res.clearCookie(DEMO_COOKIE_NAME, clearCookieOptions);
    return;
  }
  res.clearCookie(COOKIE_NAME, clearCookieOptions);
};

export const getAuthToken = (req) => {
  // Prefer the temporary demo session while it is active. The normal
  // account cookie remains untouched and becomes active again on demo exit.
  if (req.cookies && req.cookies[DEMO_COOKIE_NAME]) {
    return req.cookies[DEMO_COOKIE_NAME];
  }
  // Otherwise use the signed-in account session.
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  // Optional fallback for testing tools: Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};
