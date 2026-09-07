const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ post: 1, parentComment: 1 });

commentSchema.post('save', async function (doc) {
  if (!doc.isDeleted) {
    const Post = mongoose.model('Post');
    await Post.findByIdAndUpdate(doc.post, { $inc: { commentCount: 1 } });
  }
});

commentSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  if (update && update.$set && update.$set.isDeleted === true) {
    const doc = await this.model.findOne(this.getFilter());
    if (doc && !doc.isDeleted) {
      const Post = mongoose.model('Post');
      await Post.findByIdAndUpdate(doc.post, { $inc: { commentCount: -1 } });
    }
  }
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
