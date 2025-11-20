// backend/middleware/authMiddleware.js
const token = require('../services/jwtService');

// Middleware to validate JWT token from Authorization header
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Authentication token is required. Format: Bearer <token>'
    });
  }

  // Extract token (format: "Bearer <token>")
  const jwtToken = authHeader.substring(7);

  try {
    if (token.isExpired(jwtToken)) {
      return res.status(401).json({ 
        error: 'The JWT is no longer valid'
      });
    }
    
    // Store token in req for token refresh middleware
    req.jwtToken = jwtToken;
    
    // Token is valid, proceed to next middleware/controller
    next();
  } catch (e) {
    console.error('Auth middleware error:', e.message);
    return res.status(401).json({ 
      error: 'Invalid authentication token'
    });
  }
};

module.exports = authMiddleware;