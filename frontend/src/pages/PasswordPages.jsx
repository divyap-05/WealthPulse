import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Sparkles, Mail, ArrowRight, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import { apiRequest } from '../services/api';
import { PasswordInput } from '../components/ui/PasswordInput';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryAvailable, setRecoveryAvailable] = useState(null);

  useEffect(() => {
    apiRequest('/health')
      .then((res) => setRecoveryAvailable(res.emailConfigured === true))
      .catch(() => setRecoveryAvailable(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(res.message);
    } catch (err) {
      setError(err.message || 'Error processing request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 selection:bg-brand-primary">
      <ThemeToggle className="fixed right-5 top-5 z-50" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-purple-500/20">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">WealthPulse</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-200">Reset Your Password</h2>
          <p className="text-sm text-slate-400 mt-1">Password recovery requires email delivery.</p>
        </div>

        <div className="glass-surface p-8 rounded-2xl border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            </div>
          )}

          {recoveryAvailable === false ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm" role="status">
              Password recovery is unavailable because email delivery is not configured. If you are signed in, you can change your password from Profile settings.
            </div>
          ) : recoveryAvailable === null ? (
            <p className="text-sm text-slate-400 text-center" role="status">Checking password recovery availability…</p>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-primary hover:bg-purple-600 font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 text-white flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <span>Sending...</span> : <span>Send Reset Instructions</span>}
            </button>
          </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-brand-secondary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryAvailable, setRecoveryAvailable] = useState(null);

  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    apiRequest('/health')
      .then((res) => setRecoveryAvailable(res.emailConfigured === true))
      .catch(() => setRecoveryAvailable(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('Missing reset token. Please request a new link.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(res.message);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 selection:bg-brand-primary">
      <ThemeToggle className="fixed right-5 top-5 z-50" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-purple-500/20 mx-auto mb-3">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-200">Set New Password</h2>
          <p className="text-sm text-slate-400 mt-1">Enter your new secure password below</p>
        </div>

        <div className="glass-surface p-8 rounded-2xl border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {recoveryAvailable === false ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm" role="status">
              Password recovery is unavailable because email delivery is not configured. If you are signed in, you can change your password from Profile settings.
            </div>
          ) : recoveryAvailable === null ? (
            <p className="text-sm text-slate-400 text-center" role="status">Checking password recovery availability…</p>
          ) : success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-100 text-lg mb-2">Password Reset Complete!</h3>
              <p className="text-sm text-slate-400 mb-6">{success}</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20"
              >
                Proceed to Log In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  New Password
                </label>
                <PasswordInput
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Confirm Password
                </label>
                <PasswordInput
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-primary hover:bg-purple-600 font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 text-white flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <span>Updating...</span> : <span>Update Password</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
