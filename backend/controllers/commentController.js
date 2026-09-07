const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { asyncHandler } = require('../middleware/errorHandler');

const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { body, parentCommentId } = req.body;

  if (!body || body.trim().length === 0) {
    return res.status(400).json({ message: 'Comment body is required' });
  }

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  let depth = 0;

  if (parentCommentId) {
    const parent = await Comment.findById(parentCommentId);
    if (!parent || parent.post.toString() !== postId) {
      return res.status(404).json({ message: 'Parent comment not found on this post' });
    }
    depth = Math.min(parent.depth + 1, 3);
  }

  const comment = await Comment.create({
    post: postId,
    author: req.user._id,
    body: body.trim(),
    parentComment: parentCommentId || null,
    depth,
  });

  await comment.populate('author', 'name email');

  res.status(201).json({ success: true, comment });
});

const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId).select('_id');
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const allComments = await Comment.find({ post: postId, isDeleted: false })
    .populate('author', 'name email')
    .sort({ createdAt: 1 })
    .lean();

  const commentMap = {};
  allComments.forEach((c) => {
    commentMap[c._id.toString()] = { ...c, replies: [] };
  });

  const roots = [];
  allComments.forEach((c) => {
    if (c.parentComment) {
      const parent = commentMap[c.parentComment.toString()];
      if (parent) {
        parent.replies.push(commentMap[c._id.toString()]);
      }
    } else {
      roots.push(commentMap[c._id.toString()]);
    }
  });

  res.json({ success: true, comments: roots });
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId, postId } = req.params;

  const comment = await Comment.findOne({ _id: commentId, post: postId });
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  const isOwner = comment.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this comment' });
  }

  await Comment.findByIdAndUpdate(commentId, {
    $set: { isDeleted: true, body: '[Comment deleted]' },
  });

  res.json({ success: true, message: 'Comment deleted' });
});

module.exports = { addComment, getComments, deleteComment };
