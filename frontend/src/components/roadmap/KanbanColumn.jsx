import { formatDistanceToNow } from 'date-fns';
import { FiArrowUp, FiMessageSquare } from 'react-icons/fi';
import { useState } from 'react';
import PostDetail from '../posts/PostDetail';
import { CATEGORY_COLORS } from '../posts/postConstants';

export default function KanbanColumn({ title, posts, icon, accentClass, onAuthRequired }) {
  const [selectedPostId, setSelectedPostId] = useState(null);

  return (
    <>
      <div className="kanban-column">
        {/* Column header */}
        <div className={`flex items-center justify-between pb-3 border-b border-white/[0.06]`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className={`text-sm font-bold ${accentClass}`}>{title}</h3>
          </div>
          <span className="badge bg-surface-700 text-white/50 border border-white/[0.06] tabular-nums">
            {posts.length}
          </span>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 no-scrollbar">
          {posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-white/20 text-xs text-center gap-1">
              <span className="text-2xl opacity-40">📭</span>
              <span>Nothing here yet</span>
            </div>
          )}

          {posts.map((post, index) => (
            <button
              key={post._id}
              id={`kanban-card-${post._id}`}
              onClick={() => setSelectedPostId(post._id)}
              className="text-left w-full bg-surface-800/50 border border-white/[0.06] rounded-xl p-3.5
                         hover:border-white/15 hover:bg-surface-700/60 transition-all duration-150
                         active:scale-[0.99] group animate-slide-up"
              style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}
            >
              {/* Category badge */}
              <div className="mb-2">
                <span className={`badge border text-[10px] ${CATEGORY_COLORS[post.category] || 'badge-category'}`}>
                  {post.category}
                </span>
              </div>

              {/* Title */}
              <p className="text-white/90 text-sm font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors">
                {post.title}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-3 mt-3 text-white/30">
                <span className="flex items-center gap-1 text-xs">
                  <FiArrowUp className="w-3 h-3" />
                  {post.upvoteCount}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <FiMessageSquare className="w-3 h-3" />
                  {post.commentCount}
                </span>
                <span className="text-xs ml-auto truncate">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedPostId && (
        <PostDetail
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onAuthRequired={onAuthRequired}
        />
      )}
    </>
  );
}
