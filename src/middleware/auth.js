const jwt = require('jsonwebtoken');

const { getDb } = require('../db/database');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        
        // ENTERPRISE: Verify token_version against DB
        const db = await getDb();
        const user = await db.get("SELECT token_version FROM users WHERE id = ?", [decoded.id]);
        
        if (!user || user.token_version !== (decoded.token_version || 0)) {
            return res.status(401).json({ error: 'Unauthorized: Session expired or password changed' });
        }

        req.user = decoded; // { id, username, role, token_version }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

module.exports = {
    authMiddleware,
    adminMiddleware
};
