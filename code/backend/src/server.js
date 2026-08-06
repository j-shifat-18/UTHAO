require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
