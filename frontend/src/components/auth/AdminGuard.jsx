import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 bg-surface-700 rounded w-64 animate-pulse-soft" />
          <div className="h-10 bg-surface-700 rounded-xl w-full animate-pulse-soft" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-surface-700 rounded-xl animate-pulse-soft" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to={-1} replace />;
  }

  return <Outlet />;
}
