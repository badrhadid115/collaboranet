function checkRole(role) {
  return (req, res, next) => {
    try {
      if (req.isAuthenticated()) {
        const userRole = req.user.role?.toLowerCase();
        const replacedRole = req.user.replacedUserRole?.toLowerCase();
        if (userRole === role.toLowerCase() || replacedRole === role.toLowerCase()) {
          return next();
        }
        return res.status(403).json({ error: 'Accés non autorisé' });
      }
      res.status(401).json({ error: 'Utilisateur non authentifié' });
    } catch (err) {
      next(err);
    }
  };
}

function checkPermission(permission) {
  return (req, res, next) => {
    try {
      if (req.isAuthenticated()) {
        if (req.user.permissions?.includes(permission)) {
          return next();
        }
        return res.status(403).json({ error: 'Access Denied' });
      }
      res.status(401).json({ error: 'User not authenticated' });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  checkRole,
  checkPermission
};
