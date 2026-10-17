const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, access denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid or user is inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required'
    });
  }
};

const studentMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student role required'
    });
  }
};

const companyAdviserMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'companyAdviser') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Company Adviser role required' });
  }
};

const universityAdviserMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'universityAdviser') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. University Adviser role required' });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  studentMiddleware,
  companyAdviserMiddleware,
  universityAdviserMiddleware,
  companyAdminMiddleware: (req, res, next) => {
    if (req.user && req.user.role === 'companyAdmin') {
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Access denied. Company Admin role required' });
    }
  }
};