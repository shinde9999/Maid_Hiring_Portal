const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json('No token provided');

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json('Token error');

  const scheme = parts[0];
  const token = parts[1];

  if (!/^Bearer$/i.test(scheme)) return res.status(401).json('Token malformatted');

  try {
    const decoded = jwt.verify(token, 'secretkey');
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json('Invalid token');
  }
};
