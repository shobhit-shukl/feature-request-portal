import { useState } from 'react';
import KanbanBoard from '../components/roadmap/KanbanBoard';
import LoginModal from '../components/auth/LoginModal';
import SignupModal from '../components/auth/SignupModal';
import { FiMap, FiInfo } from 'react-icons/fi';

export default function RoadmapPage() {
  const [authModal, setAuthModal] = useState(null);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <FiMap className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
              Public Roadmap
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            What We're{' '}
            <span className="bg-gradient-to-r from-purple-300 to-brand-400 bg-clip-text text-transparent">
              Building
            </span>
          </h1>
          <p className="text-white/50 mt-2 text-sm sm:text-base max-w-xl">
            Track the status of the most-requested features, updated in real time as we ship.
          </p>
        </div>

        {/* Legend */}
        <div className="glass-card px-4 py-3 flex items-start gap-3 max-w-xs">
          <FiInfo className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs text-white/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Planned — approved & scheduled
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              In Progress — actively being built
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Completed — shipped & live
            </div>
          </div>
        </div>
      </div>

      <KanbanBoard onAuthRequired={() => setAuthModal('login')} />

      {/* Auth modals */}
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
