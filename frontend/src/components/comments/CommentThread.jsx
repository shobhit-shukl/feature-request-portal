import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import CommentForm from './CommentForm';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDistanceToNow } from 'date-fns';
import { FiCornerDownRight, FiTrash2, FiLoader, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

// ── Single Comment Node (recursive) ─────────────────────────────────────────
function CommentNode({ comment, postId, depth = 0, onAuthRequired }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReply, setShowReply] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/posts/${postId}/comments/${comment._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Comment deleted.');
    },
    onError: () => toast.error('Failed to delete comment.'),
  });

  const isOwner = user && user._id === comment.author?._id?.toString();
  const isAdmin = user?.role === 'admin';
  const canDelete = isOwner || isAdmin;

  const authorInitial = comment.author?.name?.[0]?.toUpperCase() || '?';

  return (
    <div className={`animate-fade-in ${depth > 0 ? 'ml-6 border-l border-white/[0.06] pl-4' : ''}`}>
      <div className="group flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {authorInitial}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-white/80">
              {comment.author?.name || 'Deleted User'}
            </span>
            {comment.author?._id === user?._id && (
              <span className="badge bg-brand-600/20 text-brand-400 border-brand-500/20 text-[10px] py-0">You</span>
            )}
            <span className="text-xs text-white/30">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>

            {/* Actions — appear on hover */}
            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {depth < 3 && (
                <button
                  onClick={() => {
                    if (!user) { onAuthRequired?.(); return; }
                    setShowReply(!showReply);
                  }}
                  className="btn-ghost text-xs px-2 py-1 gap-1"
                >
                  <FiCornerDownRight className="w-3 h-3" />
                  Reply
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="btn-ghost text-xs px-2 py-1 gap-1 text-red-400/70 hover:text-red-400"
                >
                  {deleteMutation.isPending
                    ? <FiLoader className="w-3 h-3 animate-spin" />
                    : <FiTrash2 className="w-3 h-3" />
                  }
                </button>
              )}
            </div>
          </div>

          {/* Markdown body */}
          <div className="markdown-body text-xs leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
          </div>

          {/* Reply form */}
          {showReply && (
            <div className="mt-3 animate-slide-down">
              <CommentForm
                postId={postId}
                parentCommentId={comment._id}
                onCancel={() => setShowReply(false)}
                onAuthRequired={onAuthRequired}
              />
            </div>
          )}

          {/* Recursive replies */}
          {comment.replies?.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentNode
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  depth={depth + 1}
                  onAuthRequired={onAuthRequired}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Comment Thread Root ────────────────────────────────────────────────────
export default function CommentThread({ postId, onAuthRequired }) {
  const { data, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.get(`/posts/${postId}/comments`).then((r) => r.data.comments),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse-soft">
            <div className="w-7 h-7 rounded-full bg-surface-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-surface-700 rounded w-24" />
              <div className="h-3 bg-surface-700 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-white/25">
        <FiMessageSquare className="w-8 h-8" />
        <p className="text-xs">No comments yet. Start the discussion!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((comment) => (
        <CommentNode
          key={comment._id}
          comment={comment}
          postId={postId}
          depth={0}
          onAuthRequired={onAuthRequired}
        />
      ))}
    </div>
  );
}
