import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import PostCard from './PostCard';
import SortFilterBar from './SortFilterBar';
import SkeletonCard from '../ui/SkeletonCard';
import Dropdown from '../ui/Dropdown';
import { FiLoader, FiAlertCircle, FiInbox } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function PostFeed({ onAuthRequired }) {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    sort: 'trending',
    category: '',
    status: '',
    search: '',
    viewMode: 'all',
    page: 1,
    limit: 15,
  });

  const handleChange = (newFilters) => {
    setFilters((f) => ({ ...f, ...newFilters, page: 1 }));
  };

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['posts', filters],
    queryFn: () =>
      api
        .get('/posts', {
          params: {
            sort: filters.sort,
            category: filters.category || undefined,
            status: filters.status || undefined,
            search: filters.search || undefined,
            page: filters.page,
            limit: filters.limit,
          },
        })
        .then((r) => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const posts = data?.posts || [];
  const pagination = data?.pagination;

  const displayedPosts = filters.viewMode === 'mine' && user
    ? posts.filter((post) => post.author?._id === user._id || post.author === user._id)
    : posts;

  return (
    <div className="space-y-5">
      <SortFilterBar
        sort={filters.sort}
        category={filters.category}
        status={filters.status}
        search={filters.search}
        viewMode={filters.viewMode}
        showViewMode={!!user}
        onChange={handleChange}
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-16 text-white/40">
          <FiAlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm">Failed to load posts. Is the backend running?</p>
        </div>
      )}

      {!isLoading && !isError && posts.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-white/30">
          <FiInbox className="w-12 h-12" />
          <p className="text-sm font-medium">No feature requests yet</p>
          <p className="text-xs">Be the first to submit an idea!</p>
        </div>
      )}

      {/* Fetching indicator */}
      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 text-brand-400 text-xs justify-end">
          <FiLoader className="w-3.5 h-3.5 animate-spin" />
          <span>Refreshing…</span>
        </div>
      )}

      <div className="space-y-3">
        {displayedPosts.map((post, index) => (
          <div 
            key={post._id} 
            className="animate-slide-up" 
            style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}
          >
            <PostCard post={post} onAuthRequired={onAuthRequired} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 gap-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-4">
            <p className="text-white/30 text-xs">
              {pagination.total} total · Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-xs">Rows:</span>
              <div className="relative z-10 w-20">
                <Dropdown
                  value={filters.limit}
                  onChange={(val) => setFilters((f) => ({ ...f, limit: Number(val), page: 1 }))}
                  options={[
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 15, label: '15' },
                    { value: 20, label: '20' },
                    { value: 50, label: '50' }
                  ]}
                  buttonClassName="bg-surface-900/60 border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white/70 w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              disabled={filters.page <= 1}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              disabled={filters.page >= pagination.pages}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
