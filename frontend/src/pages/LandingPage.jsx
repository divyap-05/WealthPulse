import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  PieChart,
  Repeat,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
  const { enterDemo, isAuthenticated } = useAuth();
  const [demoLoading, setDemoLoading] = React.useState(false);
  const [demoError, setDemoError] = React.useState('');
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    try {
      setDemoError('');
      setDemoLoading(true);
      await enterDemo();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setDemoError(err.message || 'Unable to connect to the backend server. Please verify the server is running on port 5000.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col selection:bg-brand-primary">
      {/* Navbar */}
      <header className="border-b border-white/10 glass-surface sticky top-0 z-50 px-6 lg:px-16 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              WealthPulse
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <button
                onClick={handleDemoClick}
                disabled={demoLoading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-secondary hover:text-white hover:bg-white/5 transition-all"
              >
                {demoLoading ? 'Loading Demo...' : 'Explore Demo'}
              </button>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 font-semibold text-sm transition-all shadow-lg shadow-purple-500/20"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-16 py-20 lg:py-32 flex flex-col items-center text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5 text-brand-secondary" />
          <span>Multi-User Personal Finance Application</span>
        </div>

        {demoError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-lg mx-auto">
            {demoError}
          </div>
        )}

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none mb-6">
          Precision Financial Control,{' '}
          <span className="bg-gradient-to-r from-brand-secondary via-purple-400 to-brand-rose bg-clip-text text-transparent">
            Refined for Individuals.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 font-normal leading-relaxed">
          Manage your personal cash flow, automated recurring commitments, monthly category budgets, and target savings goals with transparent rule-based financial analytics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            to="/register"
            className="px-8 py-3.5 rounded-xl bg-brand-primary hover:bg-purple-600 font-semibold text-base transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <button
            onClick={handleDemoClick}
            disabled={demoLoading}
            className="px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold text-base transition-all flex items-center justify-center gap-2 text-slate-200"
          >
            <span>Launch Live Demo Account</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          <div className="p-6 rounded-2xl glass-card border border-white/10 relative overflow-hidden group hover:border-brand-primary/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center mb-4 text-brand-secondary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-white">Private Multi-Tenant Workspaces</h3>
            <p className="text-sm text-slate-400">
              Strict server-side data isolation. Every ledger entry, custom category, and budget is cryptographically scoped to your account.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/10 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-white">Decimal-Safe INR Money Ledger</h3>
            <p className="text-sm text-slate-400">
              Exact integer paisa calculations prevent floating point truncation. Real Indian Rupee (₹) formatting and comprehensive analytics.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/10 relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4 text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-white">Rule-Based Smart Insights</h3>
            <p className="text-sm text-slate-400">
              Automated observations on your top spenders, budget deviations, and savings rates based purely on verified mathematical analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 WealthPulse. Developed as a production-grade full-stack portfolio system.</p>
      </footer>
    </div>
  );
};
