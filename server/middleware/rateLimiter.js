const rateLimit = require('express-rate-limit');
const { rateLimit: rateLimitConfig } = require('../config/environment');

function configureRateLimiter() {
  return rateLimit({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.maxRequests,
    message: 'Trop de requêtes effectuées depuis cette adresse IP, veuillez réessayer plus tard.'
  });
}

const loginAttempts = new Map();
const rateLimitAuth = (req, res, next) => {
  const ip = req.ip;
  const maxAttempts = 3;
  const windowMs = 60000;
  const now = Date.now();
  if (loginAttempts.has(ip)) {
    const attempts = loginAttempts.get(ip);
    const recentAttempts = attempts.filter((attempt) => now - attempt < windowMs);
    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({ type: 'many-attempts' });
    }
    loginAttempts.set(ip, recentAttempts.concat(now));
  } else {
    loginAttempts.set(ip, [now]);
  }
  next();
};
module.exports = { configureRateLimiter, rateLimitAuth };
