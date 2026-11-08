import express from 'express';
import mongoose from 'mongoose';
import { createApp } from './src/app.js';
import { connectDB } from './src/config/db.js';
import { validateConfig } from './src/config/env.js';

const app = express();
let connectionPromise;

// Vercel places one trusted proxy in front of this function. Trust only that
// hop so Express and express-rate-limit use the forwarded client IP safely.
app.set('trust proxy', 1);

app.use(async (req, res, next) => {
  try {
    validateConfig();

    if (mongoose.connection.readyState !== 1) {
      if (!connectionPromise) {
        connectionPromise = connectDB().catch((error) => {
          connectionPromise = null;
          throw error;
        });
      }
      await connectionPromise;
    }

    next();
  } catch (error) {
    // Keep deployment diagnostics useful without exposing connection details.
    console.error('[Vercel API startup error]', error.name || 'Error');
    res.status(503).json({
      success: false,
      message: 'The API is temporarily unavailable. Check the backend deployment configuration.',
    });
  }
});

app.use(createApp());

export default app;
