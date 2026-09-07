import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UpvoteButton from './UpvoteButton';
import CommentThread from '../comments/CommentThread';
import CommentForm from '../comments/CommentForm';
import { CATEGORY_COLORS, STATUS_MAP } from './postConstants';

export default function PostDetail({ postId, onClose, onAuthRequired }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.get(`/posts/${postId}`).then((r) => r.data.post),
    staleTime: 30_000,
  });

  if (!document.body) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4 sm:p-6" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-[#13141a] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col z-[1000] overflow-hidden shadow-2xl border border-white/10">
        {/* Absolute Close Button */}
        <button
          onClick={onClose}
          id="close-post-detail"
          className="absolute top-4 right-4 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors z-50"
        >
          <FiX className="w-5 h-5" />
        </button>
        {isLoading && (
          <div className="p-6 space-y-6">
            {/* Header Skeleton */}
            <div className="flex gap-4 border-b border-white/[0.06] pb-6">
              <div className="w-10 h-14 bg-surface-700 rounded-xl animate-pulse-soft flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-surface-700 rounded w-3/4 animate-pulse-soft" />
                <div className="flex gap-2">
                  <div className="h-4 bg-surface-700 rounded w-16 animate-pulse-soft" />
                  <div className="h-4 bg-surface-700 rounded w-20 animate-pulse-soft" />
                </div>
              </div>
            </div>
            
            {/* Body Skeleton */}
            <div className="space-y-3 border-b border-white/[0.06] pb-6">
              <div className="h-3 bg-surface-700 rounded w-full animate-pulse-soft" />
              <div className="h-3 bg-surface-700 rounded w-5/6 animate-pulse-soft" />
              <div className="h-3 bg-surface-700 rounded w-4/6 animate-pulse-soft" />
            </div>
            
            {/* Comments Skeleton */}
            <div className="space-y-4">
              <div className="h-4 bg-surface-700 rounded w-24 animate-pulse-soft" />
              <div className="h-20 bg-surface-700 rounded-xl w-full animate-pulse-soft" />
            </div>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-white/50">
            <FiAlertCircle className="w-10 h-10 text-red-400" />
            <p>Failed to load post. Please try again.</p>
          </div>
        )}

        {data && (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 p-6 border-b border-white/[0.06] pr-16 flex-shrink-0">
              <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 mt-1">
                <UpvoteButton
                  postId={data._id}
                  upvoteCount={data.upvoteCount}
                  hasUpvoted={data.hasUpvoted}
                  onAuthRequired={onAuthRequired}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold text-white leading-snug">{data.title}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`badge border ${CATEGORY_COLORS[data.category] || 'badge-category'}`}>
                    {data.category}
                  </span>
                  <span className={STATUS_MAP[data.status]}>
                    {data.status}
                  </span>
                  <span className="text-white/30 text-xs">
                    by {data.author?.name} ·{' '}
                    {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {/* Body */}
              <div className="p-6 border-b border-white/[0.06] space-y-6">
                {data.status === 'Rejected' && data.rejectionReason && (
                  <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg mb-6">
                    <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Admin Note (Rejection Reason)</h4>
                    <p className="text-red-200/90 text-sm">{data.rejectionReason}</p>
                  </div>
                )}

                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.description}</ReactMarkdown>
                </div>
                
                {data.imageUrl && (
                  <div className="mt-4">
                    <a href={data.imageUrl} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={data.imageUrl} 
                        alt="Attachment" 
                        className="max-h-96 w-auto rounded-lg border border-white/[0.1] shadow-lg cursor-pointer hover:opacity-90 transition-opacity" 
                      />
                    </a>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="p-6 space-y-6">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                  Discussion
                </h3>
                <CommentForm postId={postId} onAuthRequired={onAuthRequired} />
                <CommentThread postId={postId} onAuthRequired={onAuthRequired} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
