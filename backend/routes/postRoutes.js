const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPostById, toggleUpvote, updateStatus, deletePost } = require('../controllers/postController');
const { protect, optionalAuth, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPostById);
router.post('/', protect, upload.single('image'), createPost);
router.patch('/:id/upvote', protect, toggleUpvote);
router.delete('/:id', protect, deletePost);
router.patch('/:id/status', protect, adminOnly, updateStatus);

module.exports = router;
