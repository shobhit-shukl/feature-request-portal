const crypto = require('crypto');
const User = require('../models/User');
const {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/tokenUtils');
const { asyncHandler } = require('../middleware/errorHandler');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const user = new User({ name, email, passwordHash: password });
  const rawVerifyToken = user.generateEmailVerifyToken();
  await user.save();

  res.status(201).json({
    message: 'Account created. Check your email to verify your account.',
    _devEmailVerifyToken: rawVerifyToken,
    userId: user._id,
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerifyToken: hashedToken,
    emailVerifyExpires: { $gt: Date.now() },
  }).select('+emailVerifyToken +emailVerifyExpires');

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification token' });
  }

  user.isVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully. You can now log in.' });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +refreshTokens');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      message: 'Please verify your email before logging in',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  const hashedRefresh = hashToken(refreshToken);
  user.refreshTokens.push(hashedRefresh);

  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save();

  setRefreshCookie(res, refreshToken);

  res.json({
    accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      upvotedPosts: user.upvotedPosts,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  let decoded;
  try {
    decoded = verifyToken(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (_) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  if (decoded.type !== 'refresh') {
    return res.status(401).json({ message: 'Invalid token type' });
  }

  const hashedIncoming = hashToken(incomingRefreshToken);
  const user = await User.findById(decoded.sub).select('+refreshTokens');

  if (!user || !user.refreshTokens.includes(hashedIncoming)) {
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Refresh token reuse detected. All sessions invalidated.' });
  }

  const newAccessToken = signAccessToken(user._id);
  const newRefreshToken = signRefreshToken(user._id);
  const hashedNew = hashToken(newRefreshToken);

  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashedIncoming);
  user.refreshTokens.push(hashedNew);
  await user.save();

  setRefreshCookie(res, newRefreshToken);

  res.json({
    accessToken: newAccessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      upvotedPosts: user.upvotedPosts,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (incomingRefreshToken) {
    try {
      const decoded = verifyToken(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decoded.sub).select('+refreshTokens');
      if (user) {
        const hashedIncoming = hashToken(incomingRefreshToken);
        user.refreshTokens = user.refreshTokens.filter((t) => t !== hashedIncoming);
        await user.save();
      }
    } catch (_) {
      // Token already invalid — proceed
    }
  }

  clearRefreshCookie(res);
  res.json({ message: 'Logged out successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { signup, verifyEmail, login, refresh, logout, getMe };
