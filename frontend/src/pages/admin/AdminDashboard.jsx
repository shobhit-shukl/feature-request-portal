import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FiBarChart2, FiList, FiUsers, FiMessageSquare,
  FiArrowUp, FiSearch, FiLoader, FiLogOut,
  FiCheckCircle, FiClock, FiZap, FiMap, FiImage, FiXCircle, FiMenu, FiX as FiClose
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { CATEGORY_COLORS, STATUS_MAP } from '../../components/posts/postConstants';
import toast from 'react-hot-toast';
import PostDetail from '../../components/posts/PostDetail';
import Dropdown from '../../components/ui/Dropdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// ── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ['Under Review', 'Planned', 'In Progress', 'Completed', 'Rejected'];

const STATUS_CONFIG = {
  'Under Review': { icon: FiClock,        color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  'Planned':      { icon: FiMap,          color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  'In Progress':  { icon: FiZap,          color: 'text-purple-400', bg: 'bg-purple-500/10' },
  'Completed':    { icon: FiCheckCircle,  color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
  'Rejected':     { icon: FiXCircle,      color: 'text-red-400',    bg: 'bg-red-500/10'    },
};

// ── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data.analytics),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card h-28 animate-pulse-soft" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-red-400 text-sm">Failed to load analytics.</p>;
  }

  const metrics = [
    { label: 'Total Users',    value: data.totalUsers, icon: FiUsers,      color: 'from-brand-500 to-blue-600'   },
    { label: 'Total Requests', value: data.totalPosts, icon: FiList,       color: 'from-purple-500 to-pink-600'  },
    { label: 'Total Votes',    value: data.totalVotes, icon: FiArrowUp,    color: 'from-amber-500 to-orange-600' },
    { label: 'Avg Votes/Post', value: data.avgVotes,   icon: FiBarChart2,  color: 'from-emerald-500 to-teal-600' },
  ];

  const totalPosts = data.totalPosts || 1;

  return (
    <div className="space-y-8">
      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-glow-sm`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-white tabular-nums leading-tight">{value.toLocaleString()}</p>
              <p className="text-[11px] text-white/40 mt-0.5 leading-tight truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6">
          Status Breakdown
        </h3>
        <div className="space-y-4">
          {STATUSES.map((status) => {
            const count = data.statusCounts[status] || 0;
            const pct   = Math.round((count / totalPosts) * 100);
            const { icon: Icon, color, bg } = STATUS_CONFIG[status];
            return (
              <div key={status} className="flex items-center gap-4">
                <div className={`flex items-center gap-2 w-36 flex-shrink-0 ${bg} rounded-xl px-3 py-1.5`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className={`text-xs font-semibold ${color}`}>{status}</span>
                </div>
                <div className="flex-1 bg-surface-900 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 bg-gradient-to-r ${
                      status === 'Completed'    ? 'from-emerald-500 to-teal-500' :
                      status === 'In Progress'  ? 'from-purple-500 to-pink-500'  :
                      status === 'Planned'      ? 'from-blue-500 to-cyan-500'    :
                      status === 'Rejected'     ? 'from-red-500 to-rose-500'     :
                                                  'from-yellow-500 to-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 w-20 flex-shrink-0 text-right">
                  <span className="text-white font-bold text-sm tabular-nums ml-auto">{count}</span>
                  <span className="text-white/30 text-xs w-8">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Votes Activity Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6">
            Votes Activity (Last 7 Days)
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" tick={{ fill: '#ffffff40', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff40', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #ffffff1a', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="votes" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#1a1a24' }} activeDot={{ r: 6, fill: '#c4b5fd' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6">
            Recent Activity
          </h3>
          <div className="relative pl-3 border-l border-white/[0.08] space-y-6">
            {(data.recentActivity || []).length === 0 && (
              <p className="text-white/40 text-sm">No recent activity.</p>
            )}
            {(data.recentActivity || []).map((item) => (
              <div key={item.id} className="relative">
                <div className={`absolute -left-[17px] top-1.5 w-2 h-2 rounded-full ring-4 ring-surface-950 ${item.type === 'submit' ? 'bg-brand-500' : 'bg-purple-500'}`} />
                <div className="pl-4">
                  <p className="text-sm text-white/90 leading-snug">{item.action}</p>
                  <p className="text-xs text-white/40 mt-1">{formatDistanceToNow(new Date(item.time), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Requests Tab ─────────────────────────────────────────────────────────────

function RequestsTab() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, limit: 15, status: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [rejectingPost, setRejectingPost] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-requests', filters],
    queryFn: () =>
      api.get('/admin/requests', {
        params: {
          page:   filters.page,
          limit:  filters.limit,
          status: filters.status || undefined,
          search: filters.search || undefined,
        },
      }).then((r) => r.data),
    keepPreviousData: true,
    staleTime: 15_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ postId, status, rejectionReason }) => 
      api.patch(`/posts/${postId}/status`, { status, rejectionReason }),
    onSuccess: (_, { status }) => {
      toast.success(`Status updated to "${status}" — author notified by email`);
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
  };

  const handleStatusChange = (e, post) => {
    e.stopPropagation(); // prevent opening the modal
    const newStatus = e.target.value;
    
    if (newStatus === 'Rejected') {
      setRejectingPost(post);
      setRejectionReason('');
    } else {
      statusMutation.mutate({ postId: post._id, status: newStatus });
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      toast.error("A reason is required to reject a request.");
      return;
    }
    statusMutation.mutate({ postId: rejectingPost._id, status: 'Rejected', rejectionReason: rejectionReason.trim() });
    setRejectingPost(null);
  };

  const posts      = data?.posts      || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
            <input
              id="admin-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title or description…"
              className="input pl-10 text-sm"
            />
          </div>
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>

        <div className="relative z-20">
          <Dropdown
            value={filters.status}
            onChange={(val) => setFilters((f) => ({ ...f, status: val, page: 1 }))}
            options={[{ value: '', label: 'All Statuses' }, ...STATUSES.map(s => ({ value: s, label: s }))]}
            buttonClassName="bg-surface-900/60 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 min-w-[140px]"
          />
        </div>
      </div>

      {/* Refresh indicator */}
      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 text-brand-400 text-xs">
          <FiLoader className="w-3 h-3 animate-spin" />
          <span>Refreshing…</span>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[750px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Title', 'Author', 'Category', 'Attachment', 'Votes', 'Comments', 'Submitted', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-surface-700 rounded animate-pulse-soft" style={{ width: `${40 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-white/30 text-sm py-12">
                    No requests found matching your filters.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post._id}
                    id={`admin-row-${post._id}`}
                    onClick={() => setSelectedPostId(post._id)}
                    className="border-b border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-colors group focus-within:relative focus-within:z-50 hover:relative hover:z-40"
                  >
                    {/* Title */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-white/90 font-medium text-xs leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors">
                        {post.title}
                      </p>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="text-white/75 text-xs font-medium">{post.author?.name}</p>
                        <p className="text-white/30 text-[10px] truncate max-w-[120px]">{post.author?.email}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge border text-[10px] ${CATEGORY_COLORS[post.category] || 'badge-category'}`}>
                        {post.category}
                      </span>
                    </td>

                    {/* Attachment */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {post.imageUrl ? (
                        <a 
                          href={post.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-brand-300 transition-colors"
                          title="View Attachment"
                        >
                          <FiImage className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-white/10 text-xs">-</span>
                      )}
                    </td>

                    {/* Votes */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        <FiArrowUp className="w-3 h-3" />
                        <span className="font-bold">{post.upvoteCount}</span>
                      </div>
                    </td>

                    {/* Comments */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        <FiMessageSquare className="w-3 h-3" />
                        <span>{post.commentCount}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-white/35 text-xs">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </td>

                    {/* Status dropdown */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Dropdown
                        value={post.status}
                        onChange={(val) => handleStatusChange({ target: { value: val }, stopPropagation: () => {} }, post)}
                        options={STATUSES.map(s => ({ value: s, label: s }))}
                        buttonClassName={`text-xs rounded-xl px-3 py-1.5 border font-semibold min-w-[130px]
                          ${post.status === 'Completed'   ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' :
                            post.status === 'In Progress' ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'   :
                            post.status === 'Planned'     ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'         :
                            post.status === 'Rejected'    ? 'bg-red-500/15 border-red-500/30 text-red-300'            :
                                                            'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'   }
                        `}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-3">
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

      {selectedPostId && (
        <PostDetail postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
      )}

      {rejectingPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-white mb-2">Reject Request</h3>
            <p className="text-white/60 text-sm mb-4">
              Please provide a reason for rejecting <span className="text-white font-medium">"{rejectingPost.title}"</span>. This will be emailed to the author.
            </p>
            <textarea
              className="w-full bg-surface-950 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 min-h-[100px] resize-none mb-4"
              placeholder="e.g. This is out of scope for our current roadmap..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectingPost(null)}
                className="btn-ghost px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="btn-primary px-4 py-2 text-sm bg-red-500 hover:bg-red-600 shadow-glow-sm shadow-red-500/20 text-white border-red-500/50"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Dashboard Root ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'requests'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out.');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-surface-950 overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/6 rounded-full blur-3xl" />
      </div>

      {/* ── Mobile Top Bar (hamburger) ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-surface-950/90 backdrop-blur-xl z-30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
            <FiZap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight text-sm">FR&amp;RP</span>
          <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">Pro</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Open sidebar"
        >
          <FiMenu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile Backdrop Overlay ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full w-64 flex-shrink-0
        border-r border-white/[0.05] bg-surface-950/95 backdrop-blur-xl
        flex flex-col z-50 md:z-10
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-white/[0.05]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
                <FiZap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-white tracking-tight text-sm leading-tight">Feature Request</p>
                <p className="text-[11px] text-white/40 leading-tight">&amp; Public Roadmap Portal</p>
              </div>
            </div>
            {/* Close button — mobile only */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Close sidebar"
            >
              <FiClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-2">
          <p className="px-3 text-xs font-semibold text-white/30 uppercase tracking-widest mb-4 mt-2">Menu</p>
          
          <button
            onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
              activeTab === 'analytics'
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <FiBarChart2 className="w-5 h-5" />
            Analytics
          </button>
          
          <button
            onClick={() => { setActiveTab('requests'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
              activeTab === 'requests'
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <FiList className="w-5 h-5" />
            Requests
          </button>
        </div>

        <div className="p-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 mb-4 px-3">
            <div className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center text-sm font-bold text-white border border-white/10">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto relative z-10 px-4 md:px-8 py-6">
        <div className="space-y-6 w-full">
          {/* Page heading */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {activeTab === 'analytics' ? 'Dashboard Overview' : 'Manage Requests'}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {activeTab === 'analytics' 
                ? 'Track your community metrics and product feature roadmap.' 
                : 'Review, moderate, and update the status of user submissions.'}
            </p>
          </div>

          {/* Tab content */}
          <div className="animate-fade-in">
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'requests'  && <RequestsTab  />}
          </div>
        </div>
      </main>
    </div>
  );
}
