const Post = require('../models/Post');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendStatusUpdateEmail } = require('../utils/sendEmail');

// ── Helpers ────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['UI/UX', 'Integrations', 'Performance', 'General'];
const VALID_STATUSES = ['Under Review', 'Planned', 'In Progress', 'Completed', 'Rejected'];

// ── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/posts
 * Creates a new feature request post. Requires authentication.
 */
const createPost = asyncHandler(async (req, res) => {
  const { title, description, category, tags } = req.body;

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  // Parse tags if it comes as a string (FormData often sends arrays as comma-separated strings or multiple fields)
  let parsedTags = [];
  if (tags) {
    parsedTags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  let imageUrl = '';
  if (req.file) {
    imageUrl = req.file.path; // Multer-storage-cloudinary places the URL here
  }

  const post = await Post.create({
    title,
    description,
    category,
    tags: parsedTags,
    imageUrl,
    author: req.user._id,
  });

  await post.populate('author', 'name email');

  res.status(201).json({ success: true, post });
});

/**
 * GET /api/posts
 * Returns paginated posts with optional sorting and filtering.
 *
 * Query params:
 *   - sort: 'upvotes' | 'trending' | 'newest' | 'discussed' (default: 'newest')
 *   - category: filter by category
 *   - status: filter by status
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 20, max: 50)
 */
const getPosts = asyncHandler(async (req, res) => {
  const {
    sort = 'newest',
    category,
    status,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter = {};
  if (category && VALID_CATEGORIES.includes(category)) filter.category = category;
  if (status && VALID_STATUSES.includes(status)) filter.status = status;
  if (search && search.trim() !== '') {
    // Basic case-insensitive search by title
    filter.title = { $regex: search.trim(), $options: 'i' };
  }

  // Build sort
  let sortObj = {};
  switch (sort) {
    case 'upvotes':
      sortObj = { upvoteCount: -1, createdAt: -1 };
      break;
    case 'discussed':
      sortObj = { commentCount: -1, createdAt: -1 };
      break;
    case 'newest':
    default:
      sortObj = { createdAt: -1 };
      break;
  }

  let posts = await Post.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .populate('author', 'name email')
    .lean();

  // Trending sort: compute score in-memory (no DB index needed for small sets)
  if (sort === 'trending') {
    posts = posts.sort((a, b) => {
      const scoreA =
        a.upvoteCount / Math.pow((Date.now() - new Date(a.createdAt).getTime()) / 3600000 + 2, 1.5);
      const scoreB =
        b.upvoteCount / Math.pow((Date.now() - new Date(b.createdAt).getTime()) / 3600000 + 2, 1.5);
      return scoreB - scoreA;
    });
  }

  const total = await Post.countDocuments(filter);

  // Attach hasUpvoted field for the requesting user
  const userId = req.user?._id?.toString();
  if (userId) {
    posts = posts.map((p) => ({
      ...p,
      hasUpvoted: p.upvotes.map((id) => id.toString()).includes(userId),
    }));
  }

  res.json({
    success: true,
    posts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * GET /api/posts/:id
 * Returns a single post with full details.
 */
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'name email')
    .lean();

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const userId = req.user?._id?.toString();
  const postWithMeta = {
    ...post,
    hasUpvoted: userId
      ? post.upvotes.map((id) => id.toString()).includes(userId)
      : false,
  };

  res.json({ success: true, post: postWithMeta });
});

/**
 * PATCH /api/posts/:id/upvote
 * Atomically toggles the current user's upvote on a post.
 * Uses the static Post.toggleUpvote method (prevents duplicates at DB level).
 */
const toggleUpvote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const post = await Post.findById(id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const { post: updatedPost, voted } = await Post.toggleUpvote(id, userId);

  // Keep User.upvotedPosts in sync (best-effort, non-blocking)
  if (voted) {
    await User.findByIdAndUpdate(userId, { $addToSet: { upvotedPosts: id } });
  } else {
    await User.findByIdAndUpdate(userId, { $pull: { upvotedPosts: id } });
  }

  res.json({
    success: true,
    voted,
    upvoteCount: updatedPost.upvoteCount,
    message: voted ? 'Upvote added' : 'Upvote removed',
  });
});

/**
 * PATCH /api/posts/:id/status
 * Updates the status of a post. Admin only.
 * Fires an email notification to the post author (non-blocking).
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
    return res.status(400).json({ message: 'A reason is required when rejecting a post.' });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { status, rejectionReason: status === 'Rejected' ? rejectionReason.trim() : '' },
    { new: true, runValidators: true }
  ).populate('author', 'name email');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // ── Fire email notification (non-blocking — never fails the request) ──────
  if (post.author?.email) {
    sendStatusUpdateEmail({
      authorName:      post.author.name,
      authorEmail:     post.author.email,
      postTitle:       post.title,
      postDescription: post.description,
      newStatus:       post.status,
      postId:          post._id.toString(),
      rejectionReason: post.rejectionReason,
    }).catch((err) => {
      console.error('[Email] Status notification failed:', err.message);
    });
  }

  res.json({ success: true, post });
});

/**
 * DELETE /api/posts/:id
 * Deletes a post. Author or admin only.
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const isOwner = post.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this post' });
  }

  await post.deleteOne();
  res.json({ success: true, message: 'Post deleted' });
});

module.exports = { createPost, getPosts, getPostById, toggleUpvote, updateStatus, deletePost };
