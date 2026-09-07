import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PostFeed from '../components/posts/PostFeed';
import PostModal from '../components/posts/PostModal';
import LoginModal from '../components/auth/LoginModal';
import SignupModal from '../components/auth/SignupModal';
import { FiPlus, FiZap } from 'react-icons/fi';

export default function HomePage() {
  const { user } = useAuth();
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [authModal, setAuthModal]         = useState(null); // null | 'login' | 'signup'

  const handleAuthRequired = () => setAuthModal('login');

  const handleNewPost = () => {
    if (!user) { setAuthModal('login'); return; }
    setPostModalOpen(true);
  };

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <FiZap className="w-4 h-4 text-brand-400" />
            </div>
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">
              Feature Requests
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Shape the{' '}
            <span className="gradient-text">Roadmap</span>
          </h1>
          <p className="text-white/50 mt-2 text-sm sm:text-base max-w-xl">
            Submit ideas, vote on features you care about, and follow our progress in real time.
          </p>
        </div>

        {user?.role !== 'admin' && (
          <button
            id="new-feature-btn"
            onClick={handleNewPost}
            className="btn-primary px-5 py-3 text-sm font-semibold self-start sm:self-auto flex-shrink-0"
          >
            <FiPlus className="w-4 h-4" />
            Submit a Feature
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total Requests', emoji: '📋' },
          { label: 'Under Review',   emoji: '🔍' },
          { label: 'Completed',      emoji: '✅' },
        ].map(({ label, emoji }) => (
          <div key={label} className="glass-card px-4 py-3 flex items-center gap-3">
            <span className="text-xl">{emoji}</span>
            <span className="text-xs sm:text-sm text-white/50 font-medium">{label}</span>
          </div>
        ))}
      </div>

      <PostFeed onAuthRequired={handleAuthRequired} />

      {/* Modals */}
      {postModalOpen && <PostModal onClose={() => setPostModalOpen(false)} />}
      {authModal === 'login' && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSwitchToSignup={() => setAuthModal('signup')}
        />
      )}
      {authModal === 'signup' && (
        <SignupModal
          onClose={() => setAuthModal(null)}
          onSwitchToLogin={() => setAuthModal('login')}
        />
      )}
    </>
  );
}
