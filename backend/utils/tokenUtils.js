const jwt = require('jsonwebtoken');

const signAccessToken = (userId) =>
  jwt.sign(
    { sub: userId, type: 'access' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );

const signRefreshToken = (userId) =>
  jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );

const verifyToken = (token, secret) => jwt.verify(token, secret);

// In production the frontend (Vercel) and backend (Render) are on different
// domains, so the cookie must be sent cross-site: that requires SameSite=None,
// which browsers only honor when Secure is also set.
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });
};

module.exports = { signAccessToken, signRefreshToken, verifyToken, setRefreshCookie, clearRefreshCookie };
