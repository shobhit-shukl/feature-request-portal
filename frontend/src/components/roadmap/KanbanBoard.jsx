import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import KanbanColumn from './KanbanColumn';
import { FiLoader, FiAlertCircle } from 'react-icons/fi';

const KANBAN_COLUMNS = [
  {
    status: 'Planned',
    title: 'Planned',
    icon: '📋',
    accentClass: 'text-blue-300',
  },
  {
    status: 'In Progress',
    title: 'In Progress',
    icon: '⚡',
    accentClass: 'text-purple-300',
  },
  {
    status: 'Completed',
    title: 'Completed',
    icon: '✅',
    accentClass: 'text-emerald-300',
  },
];

/**
 * Fetches all posts for a given status.
 * Uses a high limit (100) since Kanban is a full overview.
 */
function useStatusPosts(status) {
  return useQuery({
    queryKey: ['posts', { status, limit: 100 }],
    queryFn: () =>
      api
        .get('/posts', { params: { status, limit: 100, sort: 'upvotes' } })
        .then((r) => r.data.posts),
    staleTime: 60_000, // Kanban refreshes less frequently
  });
}

export default function KanbanBoard({ onAuthRequired }) {
  const planned    = useStatusPosts('Planned');
  const inProgress = useStatusPosts('In Progress');
  const completed  = useStatusPosts('Completed');

  const queries = [planned, inProgress, completed];
  const isLoading = queries.some((q) => q.isLoading);
  const isError   = queries.some((q) => q.isError);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.status} className="kanban-column animate-pulse-soft">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
              <div className="w-5 h-5 rounded bg-surface-700" />
              <div className="h-4 w-24 bg-surface-700 rounded" />
            </div>
            <div className="space-y-2.5 mt-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-surface-700/50 rounded-xl h-20" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-white/40">
        <FiAlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm">Failed to load roadmap. Is the backend running?</p>
      </div>
    );
  }

  const postsByStatus = {
    'Planned':     planned.data    || [],
    'In Progress': inProgress.data || [],
    'Completed':   completed.data  || [],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {KANBAN_COLUMNS.map((col) => (
        <KanbanColumn
          key={col.status}
          title={col.title}
          posts={postsByStatus[col.status]}
          icon={col.icon}
          accentClass={col.accentClass}
          onAuthRequired={onAuthRequired}
        />
      ))}
    </div>
  );
}
