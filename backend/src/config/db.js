import mongoose from 'mongoose';
import { config } from './env.js';

let mongodInstance = null;

export const connectDB = async (customUri = null) => {
  const uri = customUri || config.mongoUri;
  try {
    // Attempt standard connection with a 4 second timeout so it doesn't hang indefinitely
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      maxPoolSize: 5,
      minPoolSize: 0,
    });
    console.log('[Database] MongoDB connected.');
    return conn;
  } catch (error) {
    console.warn('[Database Warning] Could not connect to the configured MongoDB database.');
    
    // In development mode, auto-fallback to embedded mongodb-memory-server so demo and local dev ALWAYS work zero-setup!
    if (config.env !== 'production') {
      try {
        console.log(`[Database Info] Starting embedded MongoDB instance for seamless local development...`);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Database] Embedded Local MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (memError) {
        console.error('[Database Error] Embedded MongoDB fallback failed.');
      }
    } else {
      // Let the caller decide how to handle the failure. A process exit here
      // would terminate a Vercel function before it can return an API response.
      throw error;
    }
  }
};
