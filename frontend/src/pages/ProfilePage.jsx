import React, { useState } from 'react';
import { User, Lock, ShieldCheck, Sun, Moon, AlertCircle, CheckCircle } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../services/api';
import { PasswordInput } from '../components/ui/PasswordInput';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setProfileLoading(true);

    try {
      await updateProfile({ name });
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileErr(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');

    if (newPassword !== confirmPassword) {
      setPwErr('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPwErr('New password must be at least 8 characters.');
      return;
    }

    setPwLoading(true);
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwErr(err.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <AppLayout title="Profile & Account Settings">
      <div className="max-w-4xl space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Account Preferences</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal profile, security credentials, and interface options
          </p>
        </div>

        {user?.isDemo && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>You are currently operating in Demo Mode. Account edits and password modifications are restricted.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Details */}
          <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-brand-secondary" />
                <h3 className="text-base font-bold text-white">Profile Information</h3>
              </div>

              {profileErr && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs border border-red-500/30">
                  {profileErr}
                </div>
              )}
              {profileMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/30">
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Registered Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Email address cannot be altered once verified.</p>
                </div>

                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    disabled={user?.isDemo}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileLoading || user?.isDemo}
                    className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 disabled:opacity-40 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-500/20"
                  >
                    {profileLoading ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Security / Password */}
          <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-brand-secondary" />
                <h3 className="text-base font-bold text-white">Update Password</h3>
              </div>

              {pwErr && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs border border-red-500/30">
                  {pwErr}
                </div>
              )}
              {pwMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/30">
                  {pwMsg}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Current Password</label>
                  <PasswordInput
                    required
                    disabled={user?.isDemo}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">New Password (8+ chars)</label>
                  <PasswordInput
                    required
                    minLength={8}
                    disabled={user?.isDemo}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Confirm New Password</label>
                  <PasswordInput
                    required
                    minLength={8}
                    disabled={user?.isDemo}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={pwLoading || user?.isDemo}
                    className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 disabled:opacity-40 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-500/20"
                  >
                    {pwLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Interface Preferences */}
        <div className="p-6 rounded-2xl glass-card border border-white/10">
          <h3 className="text-base font-bold text-white mb-2">Display & Currency Settings</h3>
          <p className="text-xs text-slate-400 mb-5">Workspace visualization and monetary units</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Color Theme</span>
                <span className="text-[11px] text-slate-400">Currently: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
              >
                Switch to {isDark ? 'Light' : 'Dark'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Currency Unit</span>
                <span className="text-[11px] text-slate-400">Indian Rupee (INR ₹)</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
