// cards/createJWT.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// public wrapper
exports.createToken = function (fn, ln, id) {
  return _createToken(fn, ln, id);
};

// internal helper
function _createToken(fn, ln, id) {
  try {
    const user = { userId: id, firstName: fn, lastName: ln };
    // default expiration = never (until manually revoked)
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    // you can set a limit instead, e.g.:
    // const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    return { accessToken };
  } catch (e) {
    return { error: e.message };
  }
}

// check if expired
exports.isExpired = function (token) {
  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return false;
  } catch (err) {
    return true;
  }
};

// refresh (issue new token with same payload)
exports.refresh = function (token) {
  const ud = jwt.decode(token, { complete: true });
  if (!ud || !ud.payload) return { error: 'Invalid token' };
  const { userId, firstName, lastName } = ud.payload;
  return _createToken(firstName, lastName, userId);
};

