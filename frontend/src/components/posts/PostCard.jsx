import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiMessageSquare, FiChevronRight } from 'react-icons/fi';
import UpvoteButton from './UpvoteButton';
import PostDetail from './PostDetail';
import { CATEGORY_COLORS, STATUS_MAP } from './postConstants';

export default function PostCard({ post, onAuthRequired }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <article
        id={`post-card-${post._id}`}
        onClick={() => setOpen(true)}
        className="glass-card-hover p-4 cursor-pointer group flex gap-4 animate-fade-in"
      >
        {/* Upvote */}
        <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
          <UpvoteButton
            postId={post._id}
            upvoteCount={post.upvoteCount}
            hasUpvoted={post.hasUpvoted}
            onAuthRequired={onAuthRequired}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-semibold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-brand-200 transition-colors">
              {post.title}
            </h3>
            <FiChevronRight className="flex-shrink-0 w-4 h-4 text-white/20 group-hover:text-brand-400 transition-colors mt-0.5" />
          </div>

          <p className="text-white/50 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed">
            {post.description}
          </p>

          {post.imageUrl && (
            <div className="mt-3">
              <img 
                src={post.imageUrl} 
                alt="Attachment" 
                className="h-20 w-32 object-cover rounded-lg border border-white/[0.06]" 
              />
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`badge border ${CATEGORY_COLORS[post.category] || 'badge-category'}`}>
              {post.category}
            </span>
            <span className={STATUS_MAP[post.status] || 'badge'}>
              {post.status}
            </span>

            <div className="flex items-center gap-1 text-white/30 text-xs ml-auto">
              <FiMessageSquare className="w-3.5 h-3.5" />
              <span>{post.commentCount}</span>
            </div>

            <span className="text-white/25 text-xs hidden sm:block">
              by {post.author?.name} ·{' '}
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </article>

      {open && (
        <PostDetail
          postId={post._id}
          onClose={() => setOpen(false)}
          onAuthRequired={onAuthRequired}
        />
      )}
    </>
  );
}
