const express = require('express');
const router = express.Router({ mergeParams: true });
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getComments);
router.post('/', protect, addComment);
router.delete('/:commentId', protect, deleteComment);

module.exports = router;
