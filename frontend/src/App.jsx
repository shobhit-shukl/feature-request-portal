import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import RoadmapPage from './pages/RoadmapPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGuard from './components/auth/AdminGuard';
import UserGuard from './components/auth/UserGuard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route element={<UserGuard />}>
              <Route path="/"        element={<LandingPage />} />
              <Route path="/feed"    element={<HomePage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
            </Route>
            
            <Route element={<AdminGuard />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            <Route path="*"        element={
              <div className="flex flex-col items-center justify-center py-32 text-white/30">
                <p className="text-6xl font-black text-white/10">404</p>
                <p className="mt-2 text-sm">Page not found</p>
              </div>
            } />
          </Routes>
        </Layout>

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e2035',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
