import { FiZap, FiArrowRight, FiCheck, FiTrendingUp, FiUsers, FiMap } from 'react-icons/fi';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginModal from '../components/auth/LoginModal';
import SignupModal from '../components/auth/SignupModal';

const FEATURES = [
  {
    icon: FiZap,
    title: 'Submit Feature Requests',
    description: 'Share ideas directly with the product team. Rich markdown editor, category tagging, and instant submission.',
    color: 'from-brand-500 to-blue-600',
  },
  {
    icon: FiTrendingUp,
    title: 'Atomic Upvoting',
    description: 'Vote on what matters most. Our engine guarantees zero duplicate votes — every vote counts exactly once.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: FiUsers,
    title: 'Threaded Discussions',
    description: 'Engage with the team and community through nested markdown comments on every request.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: FiMap,
    title: 'Live Public Roadmap',
    description: 'Track every request from submission to shipped. Three-column Kanban that updates in real time.',
    color: 'from-orange-500 to-amber-600',
  },
];

const STATUSES = [
  { label: 'Under Review', color: 'status-under-review', count: 12 },
  { label: 'Planned',      color: 'status-planned',      count: 8  },
  { label: 'In Progress',  color: 'status-in-progress',  count: 5  },
  { label: 'Completed',    color: 'status-completed',    count: 34 },
];

export default function LandingPage() {
  const [modal, setModal] = useState(null); // null | 'login' | 'signup'

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        {/* Badge */}
        <div className="relative mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600/15 border border-brand-500/25 text-brand-300 text-xs font-semibold uppercase tracking-widest animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Public Roadmap — Now Live
        </div>

        {/* Headline */}
        <h1 className="relative text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight max-w-4xl animate-slide-up">
          Your voice shapes{' '}
          <span className="bg-gradient-to-r from-brand-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            our product
          </span>
        </h1>

        <p className="relative mt-6 text-lg sm:text-xl text-white/50 max-w-2xl leading-relaxed animate-slide-up">
          Submit feature requests, vote on what matters, and follow our roadmap from idea to shipped — all in one transparent portal.
        </p>

        {/* CTAs */}
        <div className="relative mt-10 flex flex-col sm:flex-row items-center gap-4 animate-slide-up">
          <button
            id="hero-signup-btn"
            onClick={() => setModal('signup')}
            className="btn-primary px-8 py-4 text-base font-semibold shadow-glow"
          >
            Get Started — It's Free
            <FiArrowRight className="w-5 h-5" />
          </button>
          <Link to="/feed" className="btn-secondary px-8 py-4 text-base">
            Browse Requests
          </Link>
        </div>

        {/* Social proof strip */}
        <div className="relative mt-16 flex flex-wrap items-center justify-center gap-6 animate-fade-in">
          {STATUSES.map(({ label, color, count }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-white/40">
              <span className={color}>{label}</span>
              <span className="font-bold text-white/60">{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Everything you need to build{' '}
              <span className="gradient-text">in the open</span>
            </h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">
              A transparent feedback loop between your team and your users.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="glass-card-hover p-6 group">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-glow-sm group-hover:shadow-glow transition-shadow`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              How it works
            </h2>
            <p className="text-white/50 text-sm mb-10">Three simple steps from idea to shipped</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Submit', desc: 'Write your idea with markdown, choose a category, submit in seconds.' },
                { step: '02', title: 'Vote & Discuss', desc: 'The community upvotes and comments. Most-wanted rises to the top.' },
                { step: '03', title: 'Track Progress', desc: 'Watch your idea move from Planned → In Progress → Completed on the Kanban.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                    <span className="text-brand-400 font-black text-sm">{step}</span>
                  </div>
                  <h4 className="text-white font-semibold">{title}</h4>
                  <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to shape the roadmap?
          </h2>
          <p className="text-white/50 mb-8">
            Join the community. Your first feature request takes under a minute.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="cta-signup-btn"
              onClick={() => setModal('signup')}
              className="btn-primary px-8 py-4 text-base font-semibold shadow-glow"
            >
              Create Free Account
              <FiArrowRight className="w-5 h-5" />
            </button>
            <button
              id="cta-login-btn"
              onClick={() => setModal('login')}
              className="btn-ghost px-8 py-4 text-base"
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-8 px-4 text-center text-white/25 text-xs">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FiZap className="w-3.5 h-3.5 text-brand-500" />
          <span className="font-semibold text-white/40">Roadmap Portal</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Link to="/feed"    className="hover:text-white/60 transition-colors">Feature Requests</Link>
          <Link to="/roadmap" className="hover:text-white/60 transition-colors">Roadmap</Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} Roadmap Portal. Built with ❤️ on the MERN stack.</p>
      </footer>

      {/* Auth Modals */}
      {modal === 'login' && (
        <LoginModal onClose={() => setModal(null)} onSwitchToSignup={() => setModal('signup')} />
      )}
      {modal === 'signup' && (
        <SignupModal onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} />
      )}
    </>
  );
}
