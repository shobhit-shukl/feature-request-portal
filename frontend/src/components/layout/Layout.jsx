import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import ChatWidget from '../ui/ChatWidget';

export default function Layout({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-surface-950">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-brand-800/10 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <main className={`relative ${isAdminRoute ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {children}
      </main>

      <ChatWidget role={isAdminRoute ? 'admin' : 'user'} />
    </div>
  );
}
