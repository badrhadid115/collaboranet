const { checkPermission, checkRole } = require('./authMiddleware');
const { upload } = require('./upload');
const { configureRateLimiter, rateLimitAuth } = require('./rateLimiter');
const { configureHelmet } = require('../config/helmetConfig');
const logRequests = require('./logRequests');
const trimWhitespace = require('./trimWhitespace');

module.exports = {
  checkPermission,
  checkRole,
  upload,
  configureRateLimiter,
  rateLimitAuth,
  configureHelmet,
  logRequests,
  trimWhitespace
};
