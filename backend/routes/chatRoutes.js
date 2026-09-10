const express = require('express');
const { userChatFlow, adminChatFlow } = require('../ai/flows');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/chat/user
// Standard user chat (accessible to any authenticated user, or public depending on your needs. Here we use 'protect' to prevent abuse)
router.post('/user', protect, async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const responseText = await userChatFlow(prompt);
    res.json({ response: responseText });
  } catch (error) {
    next(error);
  }
});

// POST /api/chat/admin
// Admin chat with MCP tool capabilities
router.post('/admin', protect, adminOnly, async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const responseText = await adminChatFlow(prompt);
    res.json({ response: responseText });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
