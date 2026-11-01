export function requireAuthentication(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Please sign in first." });
  }
  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Please sign in first." });
    }
    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).json({ message: "You are not allowed to perform this action." });
    }
    next();
  };
}
