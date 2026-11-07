import React from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Target,
  Repeat,
  Tags,
  BarChart3,
  UserCheck,
  LogOut,
  Sun,
  Moon,
  TrendingUp,
  Menu,
  X,
  ArrowLeft,
  Sparkles,
  LineChart,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const navigationLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ReceiptText },
  { name: 'Budgets', path: '/budgets', icon: PieChart },
  { name: 'Savings Goals', path: '/goals', icon: Target },
  { name: 'Recurring', path: '/recurring', icon: Repeat },
  { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
  { name: 'Categories', path: '/categories', icon: Tags },
  { name: 'Profile & Settings', path: '/profile', icon: UserCheck },
];

export const AppLayout = ({ children, title = 'Finance Overview' }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleExitDemo = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-dark-bg text-slate-100' : 'bg-[#F1F5F9] text-slate-900'}`}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-white/10 p-5 glass-surface z-30">
        <Link to="/" className="flex items-center gap-3 px-2 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <LineChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              WealthPulse
            </span>
          </div>
        </Link>

        {/* Demo Mode Notice with Exit & Login for More Button */}
        {user?.isDemo && (
          <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Demo Account (Interactive)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              You can add and delete test transactions freely!
            </p>
            <div className="pt-1 flex flex-col gap-1.5">
              <Link
                to="/register"
                onClick={handleLogout}
                className="w-full py-1.5 px-2 rounded-lg bg-brand-primary hover:bg-purple-600 text-white font-semibold text-[11px] text-center transition-all shadow-sm"
              >
                Sign Up for Your Own Account
              </Link>
              <button
                onClick={handleExitDemo}
                className="w-full py-1 px-2 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 text-[11px] font-semibold text-center transition-all flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Home Page</span>
              </button>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navigationLinks.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-primary/15 text-brand-primary dark:text-brand-secondary border border-brand-primary/30 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-brand-primary dark:text-brand-secondary' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-300 dark:border-white/10 mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-sm font-bold text-brand-primary dark:text-brand-secondary">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-200">{user?.name}</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate font-medium">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 glass-surface p-6 flex flex-col h-full z-10 bg-white dark:bg-[#191820]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
                  <LineChart className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-slate-900 dark:text-white">WealthPulse</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded text-slate-500 dark:text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {user?.isDemo && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <span className="font-bold text-amber-600 block">Interactive Demo</span>
                <button
                  onClick={handleExitDemo}
                  className="w-full py-1.5 px-2 rounded-lg bg-brand-primary text-white text-xs font-semibold"
                >
                  Back to Home Page
                </button>
              </div>
            )}

            <nav className="flex-1 space-y-2 overflow-y-auto">
              {navigationLinks.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                      active
                        ? 'bg-brand-primary/15 text-brand-primary dark:text-brand-secondary font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-2 text-sm text-red-500 py-2 font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-white/10 glass-surface px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Exit / Login for More button when in Demo */}
            {user?.isDemo && (
              <div className="flex items-center gap-2">
                <Link
                  to="/register"
                  onClick={handleLogout}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold text-xs transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Account for Full Experience</span>
                </Link>
                <button
                  onClick={handleExitDemo}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Exit Demo</span>
                </button>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className="p-2 rounded-xl bg-slate-200/80 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-primary" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-300 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>INR (₹) Workspace</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="app-main flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
