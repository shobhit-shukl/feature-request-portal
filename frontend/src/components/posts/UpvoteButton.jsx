import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { FiArrowUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function UpvoteButton({ postId, upvoteCount, hasUpvoted, onAuthRequired }) {
  const { user, updateUpvote } = useAuth();
  const queryClient = useQueryClient();
  const [optimisticCount, setOptimisticCount] = useState(upvoteCount);
  const [optimisticVoted, setOptimisticVoted] = useState(hasUpvoted);

  const mutation = useMutation({
    mutationFn: () => api.patch(`/posts/${postId}/upvote`),
    onMutate: () => {
      // Optimistic update
      const willVote = !optimisticVoted;
      setOptimisticVoted(willVote);
      setOptimisticCount((c) => willVote ? c + 1 : c - 1);
    },
    onSuccess: ({ data }) => {
      setOptimisticVoted(data.voted);
      setOptimisticCount(data.upvoteCount);
      updateUpvote(postId, data.voted);
      // Invalidate feeds
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => {
      // Revert optimistic update
      setOptimisticVoted(hasUpvoted);
      setOptimisticCount(upvoteCount);
      toast.error('Failed to update vote.');
    },
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (!user) { onAuthRequired?.(); return; }
    mutation.mutate();
  };

  return (
    <button
      id={`upvote-${postId}`}
      onClick={handleClick}
      aria-label={optimisticVoted ? 'Remove upvote' : 'Upvote this feature'}
      aria-pressed={optimisticVoted}
      className={`group flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border
        transition-all duration-200 active:scale-95 min-w-[52px]
        ${optimisticVoted
          ? 'bg-brand-600/20 border-brand-500/40 text-brand-300 shadow-glow-sm'
          : 'bg-surface-900/60 border-white/[0.08] text-white/50 hover:border-brand-500/30 hover:text-brand-300 hover:bg-brand-600/10'
        }`}
    >
      <FiArrowUp
        className={`w-4 h-4 transition-transform duration-150 ${
          optimisticVoted ? 'scale-110' : 'group-hover:scale-110'
        }`}
      />
      <span className="text-xs font-bold tabular-nums leading-none">
        {optimisticCount}
      </span>
    </button>
  );
}
