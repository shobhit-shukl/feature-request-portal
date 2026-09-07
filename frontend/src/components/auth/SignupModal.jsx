import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiX, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiLoader, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SignupModal({ onClose, onSwitchToLogin }) {
  const { signup, verifyEmail } = useAuth();
  const [step, setStep]             = useState('signup'); // 'signup' | 'verify'
  const [devToken, setDevToken]     = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    setLoading(true);
    try {
      const data = await signup(form.name, form.email, form.password);
      setDevToken(data._devEmailVerifyToken || '');
      setStep('verify');
      toast.success('Account created! Check your email (or use the dev token below).');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmail(verifyCode.trim());
      toast.success('Email verified! You can now log in.');
      onSwitchToLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-md p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {step === 'signup' ? 'Create account' : 'Verify email'}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              {step === 'signup' ? 'Join the community and shape the roadmap' : 'Enter the verification token'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-slide-down">
            {error}
          </div>
        )}

        {step === 'signup' ? (
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input name="name" id="signup-name" type="text" value={form.name}
                  onChange={handleChange} className="input pl-10"
                  placeholder="Jane Smith" required autoFocus />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input name="email" id="signup-email" type="email" value={form.email}
                  onChange={handleChange} className="input pl-10"
                  placeholder="you@example.com" required />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input name="password" id="signup-password" type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  className="input pl-10 pr-10" placeholder="Min. 8 characters" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                  {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        form.password.length >= i * 2
                          ? i <= 2 ? 'bg-red-500' : i === 3 ? 'bg-yellow-500' : 'bg-emerald-500'
                          : 'bg-white/10'
                      }`} />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            {devToken && (
              <div className="p-4 rounded-xl bg-brand-600/10 border border-brand-500/25 space-y-2">
                <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider">
                  🧪 Dev Mode — Email Token
                </p>
                <code className="block text-xs text-white/70 break-all font-mono bg-surface-900 p-3 rounded-lg">
                  {devToken}
                </code>
                <button type="button" onClick={() => setVerifyCode(devToken)}
                  className="text-xs text-brand-400 hover:text-brand-300 underline">
                  Auto-fill token
                </button>
              </div>
            )}

            <div>
              <label className="label">Verification token</label>
              <input id="verify-token" type="text" value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="input font-mono text-xs" placeholder="Paste your verification token"
                required autoFocus />
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
              {loading ? 'Verifying...' : 'Verify email'}
            </button>
          </form>
        )}

        <div className="divider" />
        <p className="text-center text-white/40 text-sm">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
