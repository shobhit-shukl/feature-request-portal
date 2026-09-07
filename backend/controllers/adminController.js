const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { asyncHandler } = require('../middleware/errorHandler');

const getAnalytics = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalPosts,
    statusCounts,
    voteAgg,
    chartAgg,
    recentPosts,
    recentComments,
  ] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Post.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Post.aggregate([
      { $group: { _id: null, avgVotes: { $avg: '$upvoteCount' }, totalVotes: { $sum: '$upvoteCount' } } },
    ]),
    Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          votes: { $sum: '$upvoteCount' },
          posts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Post.find().sort({ createdAt: -1 }).limit(5).populate('author', 'name').lean(),
    Comment.find().sort({ createdAt: -1 }).limit(5).populate('author', 'name').populate('post', 'title').lean(),
  ]);

  const statusMap = {
    'Under Review': 0,
    'Planned': 0,
    'In Progress': 0,
    'Completed': 0,
    'Rejected': 0,
  };
  statusCounts.forEach(({ _id, count }) => {
    if (_id in statusMap) statusMap[_id] = count;
  });

  const avgVotes = voteAgg[0]?.avgVotes ? parseFloat(voteAgg[0].avgVotes.toFixed(1)) : 0;
  const totalVotes = voteAgg[0]?.totalVotes || 0;

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const found = chartAgg.find((item) => item._id === dateStr);
    chartData.push({
      name: dayName,
      votes: found ? found.votes : 0,
      posts: found ? found.posts : 0,
    });
  }

  const recentActivity = [
    ...recentPosts.map((p) => ({
      id: `post-${p._id}`,
      action: `${p.author?.name || 'A user'} submitted "${p.title}"`,
      time: p.createdAt,
      type: 'submit',
      color: 'text-brand-400',
    })),
    ...recentComments.map((c) => ({
      id: `comment-${c._id}`,
      action: `${c.author?.name || 'A user'} commented on "${c.post?.title || 'a post'}"`,
      time: c.createdAt,
      type: 'comment',
      color: 'text-purple-400',
    })),
  ]
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  res.json({
    success: true,
    analytics: {
      totalUsers,
      totalPosts,
      totalVotes,
      avgVotes,
      statusCounts: statusMap,
      chartData,
      recentActivity,
    },
  });
});

const getAllRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, status, search } = req.query;

  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;

  const filter = {};
  if (status && ['Under Review', 'Planned', 'In Progress', 'Completed', 'Rejected'].includes(status)) {
    filter.status = status;
  }
  if (search && search.trim()) {
    filter.$or = [
      { title:       { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'name email')
      .lean(),
    Post.countDocuments(filter),
  ]);

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

module.exports = { getAnalytics, getAllRequests };
