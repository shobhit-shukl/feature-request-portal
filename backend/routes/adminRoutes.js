const express = require('express');
const router = express.Router();
const { getAnalytics, getAllRequests } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/requests', getAllRequests);

module.exports = router;
