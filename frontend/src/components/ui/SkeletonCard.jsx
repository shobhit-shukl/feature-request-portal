export default function SkeletonCard() {
  return (
    <div className="glass-card p-4 flex gap-4 animate-pulse-soft">
      {/* Upvote button skeleton */}
      <div className="w-12 h-14 bg-surface-700/50 rounded-xl flex-shrink-0" />
      
      {/* Content skeleton */}
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-surface-700/50 rounded w-3/4" />
        <div className="h-3 bg-surface-700/50 rounded w-full" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 w-16 bg-surface-700/50 rounded-full" />
          <div className="h-5 w-20 bg-surface-700/50 rounded-full" />
        </div>
      </div>
    </div>
  );
}
