import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config, validateConfig } from './config/env.js';

const startServer = async () => {
  try {
    validateConfig();
    await connectDB();

    const app = createApp();

    app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(` 🚀 Expense Tracker API running on port ${config.port}`);
      console.log(` 🌍 Environment: ${config.env}`);
      console.log(` 🔗 Frontend URL: ${config.frontendUrl}`);
      console.log(` ✉️  Email Service: ${config.email.isConfigured ? 'Active' : 'Disabled'}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error(`[Fatal Startup Error]:`, error.message);
    process.exit(1);
  }
};

startServer();
