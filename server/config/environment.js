const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  environment: process.env.NODE_ENV || 'development',
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100
  }
};

module.exports = config;
