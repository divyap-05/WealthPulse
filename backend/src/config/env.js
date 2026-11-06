import dotenv from 'dotenv';
dotenv.config();

const requiredEnv = ['JWT_SECRET'];

// Validate environment variables at backend startup
export const validateConfig = () => {
  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_tracker',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_only_change_in_production_32chars',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  cookieSecret: process.env.COOKIE_SECRET || 'cookie_secret_at_least_32_characters_dev',
  email: {
    host: process.env.EMAIL_HOST || null,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || null,
    pass: process.env.EMAIL_PASS || null,
    from: process.env.EMAIL_FROM || 'ExpenseTracker <noreply@expensetracker.local>',
    isConfigured: Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS),
  },
};
