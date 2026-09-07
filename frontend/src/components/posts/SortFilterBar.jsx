import { FiTrendingUp, FiArrowUp, FiClock, FiMessageSquare, FiFilter, FiSearch } from 'react-icons/fi';
import Dropdown from '../ui/Dropdown';

const SORT_OPTIONS = [
  { value: 'trending',  label: 'Trending',      icon: FiTrendingUp },
  { value: 'upvotes',   label: 'Most Upvoted',   icon: FiArrowUp },
  { value: 'newest',    label: 'Newest',          icon: FiClock },
  { value: 'discussed', label: 'Most Discussed',  icon: FiMessageSquare },
];

const CATEGORIES = ['All', 'UI/UX', 'Integrations', 'Performance', 'General'];
const STATUSES   = ['All', 'Under Review', 'Planned', 'In Progress', 'Completed'];

export default function SortFilterBar({ sort, category, status, search, viewMode, showViewMode, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-white/40 w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search requests by title..."
          value={search || ''}
          onChange={(e) => onChange({ search: e.target.value })}
          className="w-full bg-surface-900/60 border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Sort tabs */}
        <div className="flex items-center gap-1 bg-surface-900/60 border border-white/[0.06] rounded-xl p-1 overflow-x-auto max-w-full custom-scrollbar">
          {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              id={`sort-${value}`}
              onClick={() => onChange({ sort: value })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                sort === value
                  ? 'bg-brand-600 text-white shadow-glow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {showViewMode && (
            <div className="flex items-center bg-surface-900/60 border border-white/[0.06] rounded-xl p-1 mr-1">
              <button
                onClick={() => onChange({ viewMode: 'all' })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  viewMode === 'all' || !viewMode
                    ? 'bg-surface-800 text-white shadow-card'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                All Requests
              </button>
              <button
                onClick={() => onChange({ viewMode: 'mine' })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  viewMode === 'mine'
                    ? 'bg-brand-600 text-white shadow-glow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                My Requests
              </button>
            </div>
          )}

          <FiFilter className="w-4 h-4 text-white/30 flex-shrink-0" />

          <div className="relative z-20">
            <Dropdown
              value={category}
              onChange={(val) => onChange({ category: val })}
              options={CATEGORIES.map(c => ({ value: c === 'All' ? '' : c, label: c }))}
              buttonClassName="bg-surface-900/80 border border-white/[0.06] rounded-xl pl-3 pr-3 py-1.5 text-xs text-white/80 min-w-[110px]"
            />
          </div>

          <div className="relative z-10">
            <Dropdown
              value={status}
              onChange={(val) => onChange({ status: val })}
              options={STATUSES.map(s => ({ value: s === 'All' ? '' : s, label: s }))}
              buttonClassName="bg-surface-900/80 border border-white/[0.06] rounded-xl pl-3 pr-3 py-1.5 text-xs text-white/80 min-w-[130px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
