const BlacklistedToken = require('../models/BlacklistedToken');
const jwt = require('jsonwebtoken');

const checkBlacklist = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.decode(token);
    const isBlacklisted = await BlacklistedToken.isBlacklisted(decoded.jwt_id);
    if (isBlacklisted) return res.status(401).json({ message: 'Token has been revoked' });

    req.user = decoded;
    next();
}

module.exports = checkBlacklist;