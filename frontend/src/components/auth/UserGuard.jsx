import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function UserGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If the user is an admin, block them from accessing user-facing pages 
  // and redirect them directly to the admin dashboard.
  if (user && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Otherwise, render the child routes (Landing, Feed, Roadmap)
  return <Outlet />;
}
