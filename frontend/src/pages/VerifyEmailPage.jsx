import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { apiRequest } from '../services/api';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token was not found in the URL.');
      return;
    }

    const verify = async () => {
      try {
        const res = await apiRequest(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.message || 'Your email has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification token is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 selection:bg-brand-primary">
      <div className="w-full max-w-md glass-surface p-8 rounded-2xl border border-white/10 text-center">
        {status === 'loading' && (
          <div className="py-8">
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-100">Verifying Email...</h2>
            <p className="text-sm text-slate-400 mt-1">Please wait while we validate your activation token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Email Confirmed</h2>
            <p className="text-sm text-slate-400 mb-6">{message}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Verification Failed</h2>
            <p className="text-sm text-slate-400 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-semibold text-sm hover:bg-white/10 transition-all"
            >
              <span>Return to Login</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
