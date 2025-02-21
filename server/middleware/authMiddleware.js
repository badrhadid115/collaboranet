const messages = require('../messages');
function checkRole(role) {
  return (req, res, next) => {
    try {
      if (req.isAuthenticated()) {
        const userRole = req.user.role?.toLowerCase();
        const replacedRole = req.user.replacedUserRole?.toLowerCase();
        if (userRole === role.toLowerCase() || replacedRole === role.toLowerCase() || role === 'super admin') {
          return next();
        }
        return res.status(403).json(messages.Error403);
      }
      res.status(401).json(messages.Error401);
    } catch (err) {
      next(err);
    }
  };
}

function checkPermission(permission) {
  return (req, res, next) => {
    try {
      if (req.isAuthenticated()) {
        if (req.user.permissions?.includes(permission) || req.user.role?.toLowerCase() === 'super admin') {
          return next();
        }
        return res.status(403).json(messages.Error403);
      }
      res.status(401).json(messages.Error401);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  checkRole,
  checkPermission
};
