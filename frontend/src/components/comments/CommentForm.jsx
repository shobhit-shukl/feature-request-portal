import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FiSend, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CommentForm({ postId, parentCommentId = null, onCancel = null, onAuthRequired }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/posts/${postId}/comments`, {
        body,
        parentCommentId: parentCommentId || undefined,
      }),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success(parentCommentId ? 'Reply posted!' : 'Comment posted!');
      onCancel?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to post comment.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) { onAuthRequired?.(); return; }
    if (!body.trim()) return;
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          id={parentCommentId ? `reply-form-${parentCommentId}` : `comment-form-${postId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onClick={() => !user && onAuthRequired?.()}
          rows={parentCommentId ? 2 : 3}
          placeholder={
            !user
              ? 'Sign in to join the discussion…'
              : parentCommentId
              ? 'Write a reply… (Markdown supported)'
              : 'Share your thoughts… (Markdown supported)'
          }
          className="input resize-none text-sm pr-12"
          maxLength={2000}
          readOnly={!user}
        />
        <button
          type="submit"
          disabled={!body.trim() || mutation.isPending}
          className="absolute bottom-2.5 right-2.5 p-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
        >
          {mutation.isPending
            ? <FiLoader className="w-3.5 h-3.5 text-white animate-spin" />
            : <FiSend className="w-3.5 h-3.5 text-white" />
          }
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/25">Markdown supported</p>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Cancel
            </button>
          )}
          <span className={`text-xs tabular-nums ${body.length > 1900 ? 'text-red-400' : 'text-white/25'}`}>
            {body.length}/2000
          </span>
        </div>
      </div>
    </form>
  );
}
