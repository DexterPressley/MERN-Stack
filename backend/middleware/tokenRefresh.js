// backend/middleware/tokenRefresh.js
const token = require('../createJWT');

// Middleware to refresh JWT token and attach to response header
const tokenRefresh = (req, res, next) => {
  const jwtToken = req.jwtToken; // Set by authMiddleware
  
  if (!jwtToken) {
    // If no token in request, skip refresh
    return next();
  }
  
  try {
    const rt = token.refresh(jwtToken);
    const refreshedToken = rt && rt.accessToken ? rt.accessToken : '';
    
    // Attach refreshed token to response header
    if (refreshedToken) {
      res.setHeader('X-Refreshed-Token', refreshedToken);
    }
    
    // Also store in res.locals for backwards compatibility if needed
    res.locals.refreshedToken = refreshedToken;
  } catch (e) {
    console.log('Token refresh error:', e.message);
    res.locals.refreshedToken = '';
  }
  
  next();
};

module.exports = tokenRefresh;