const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// ✅ Protect routes
exports.protect = async (req, res, next) => {
    let token = req.headers.authorization && req.headers.authorization.startsWith('Bearer')
        ? req.headers.authorization.split(' ')[1]
        : null;

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// 🏆 Admin-only access
exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // ✅ User is admin
    } else {
        res.status(403).json({ message: 'Access denied: Admins only' });
    }
};

