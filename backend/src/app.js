import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import savingsGoalRoutes from './routes/savingsGoalRoutes.js';
import recurringRoutes from './routes/recurringRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { enterDemoAccount } from './utils/seedDemo.js';

export const createApp = () => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parsing and cookies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(config.cookieSecret));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'Expense Tracker API',
      timestamp: new Date().toISOString(),
      emailConfigured: config.email.isConfigured,
    });
  });

  // Demo one-click access route
  app.post('/api/demo/enter', enterDemoAccount);

  // Main API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api', categoryRoutes); // /api/categories & /api/payment-methods
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/goals', savingsGoalRoutes);
  app.use('/api/recurring', recurringRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // 404 handler for unknown routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint ${req.originalUrl} not found.`,
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
};
