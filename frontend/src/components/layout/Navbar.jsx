import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../auth/LoginModal';
import SignupModal from '../auth/SignupModal';
import { FiZap, FiMap, FiUser, FiLogOut, FiChevronDown, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const [modal, setModal]           = useState(null); // null | 'login' | 'signup'
  const [userMenuOpen, setUserMenu] = useState(false);

  const isLanding = location.pathname === '/';
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    setUserMenu(false);
    await logout();
    navigate('/');
    toast.success('Logged out.');
  };

  // Hide the global Navbar completely on admin routes
  if (isAdminRoute) return null;

  const navLink = (to, label, icon) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
        location.pathname === to
          ? 'bg-brand-600/20 text-brand-300 border border-brand-500/25'
          : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full">
        <div className="bg-surface-950/80 backdrop-blur-xl border-b border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
                <FiZap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight hidden sm:block">
                Feature Request &amp; <span className="gradient-text">Roadmap Portal</span>
              </span>
              <span className="font-bold text-white text-lg tracking-tight sm:hidden">
                FR<span className="gradient-text">P</span>
              </span>
            </Link>

            {/* Nav Links — hidden on landing for cleaner look */}
            {!isLanding && (
              <nav className="hidden sm:flex items-center gap-1">
                {navLink('/feed',    'Feature Requests', <FiZap className="w-4 h-4" />)}
                {navLink('/roadmap', 'Roadmap',          <FiMap className="w-4 h-4" />)}
                {user?.role === 'admin' && navLink('/admin/dashboard', 'Admin', <FiShield className="w-4 h-4" />)}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenu(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-800 border border-white/[0.08] hover:border-white/20 transition-all duration-150"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm text-white/80 max-w-[120px] truncate">
                      {user.name}
                    </span>
                    {user.role === 'admin' && (
                      <span className="hidden sm:block badge bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                        Admin
                      </span>
                    )}
                    <FiChevronDown className={`w-4 h-4 text-white/50 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 glass-card py-2 animate-scale-in">
                      <div className="px-4 py-2 border-b border-white/[0.06] mb-1">
                        <p className="text-white text-sm font-medium truncate">{user.name}</p>
                        <p className="text-white/40 text-xs truncate">{user.email}</p>
                      </div>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserMenu(false)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          <FiShield className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        id="logout-btn"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    id="login-btn"
                    onClick={() => setModal('login')}
                    className="btn-ghost text-sm px-4 py-2"
                  >
                    Sign in
                  </button>
                  <button
                    id="signup-btn"
                    onClick={() => setModal('signup')}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Get started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modals */}
      {modal === 'login' && (
        <LoginModal
          onClose={() => setModal(null)}
          onSwitchToSignup={() => setModal('signup')}
        />
      )}
      {modal === 'signup' && (
        <SignupModal
          onClose={() => setModal(null)}
          onSwitchToLogin={() => setModal('login')}
        />
      )}

      {/* Close user menu on outside click */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenu(false)} />
      )}
    </>
  );
}
