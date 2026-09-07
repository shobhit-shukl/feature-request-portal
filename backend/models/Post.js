const mongoose = require('mongoose');

const CATEGORIES = ['UI/UX', 'Integrations', 'Performance', 'General'];
const STATUSES = ['Under Review', 'Planned', 'In Progress', 'Completed', 'Rejected'];

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      },
      required: [true, 'Category is required'],
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: `Status must be one of: ${STATUSES.join(', ')}`,
      },
      default: 'Under Review',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    upvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ upvoteCount: -1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ commentCount: -1 });
postSchema.index({ status: 1 });
postSchema.index({ category: 1 });

postSchema.statics.toggleUpvote = async function (postId, userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const afterAdd = await this.findOneAndUpdate(
    { _id: postId, upvotes: { $ne: userObjectId } },
    {
      $addToSet: { upvotes: userObjectId },
      $inc: { upvoteCount: 1 },
    },
    { new: true }
  );

  if (afterAdd) {
    return { post: afterAdd, voted: true };
  }

  const afterPull = await this.findOneAndUpdate(
    { _id: postId, upvotes: userObjectId },
    {
      $pull: { upvotes: userObjectId },
      $inc: { upvoteCount: -1 },
    },
    { new: true }
  );

  return { post: afterPull, voted: false };
};

postSchema.methods.trendingScore = function () {
  const hoursOld = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  return this.upvoteCount / Math.pow(hoursOld + 2, 1.5);
};

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
