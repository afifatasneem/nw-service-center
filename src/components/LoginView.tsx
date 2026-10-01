import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Flame, Lock, Key, LogIn, AlertCircle, HelpCircle, X, ShieldAlert } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const LoginView: React.FC = () => {
  const { login, loginError, users } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!userId.trim() || !password) {
      setLocalError('Please enter both User ID and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await login(userId.trim(), password);
      if (!ok) {
        // AuthContext handles error message
      }
    } catch {
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || loginError;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      {/* Top Banner with PWA install button */}
      <div className="absolute top-4 right-4">
        <PWAInstallButton />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* NW Service Center Emblem */}
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 shadow-2xl shadow-amber-500/25 border-2 border-amber-400/30">
            <Flame className="w-11 h-11 text-slate-950 stroke-[2.2]" />
            <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400 text-xs font-black text-slate-950 border-2 border-slate-950 shadow">
              NW
            </span>
          </div>
        </div>

        <h1 className="mt-4 text-center text-2xl sm:text-3xl font-black tracking-wider text-white">
          NW SERVICE CENTER
        </h1>
        <p className="text-center text-xs sm:text-sm font-bold text-amber-400 mt-1 uppercase tracking-widest">
          National Welding Machine Service Center
        </p>
        <p className="text-center text-xs text-slate-400 mt-0.5">
          Solapur, Maharashtra • Private Business Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl">
          <div className="pb-4 mb-5 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized personnel only. No customer access permitted.
            </p>
          </div>

          {activeError && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{activeError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                User ID
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder="Enter User ID"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 focus:outline-none transition-all active:scale-98 disabled:opacity-50 text-sm"
              >
                {isSubmitting ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 text-slate-950" />
                    <span>Login</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Private system for National Welding Machine Service Center
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Password Recovery
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                As NW Service Center is a private personal business system:
              </p>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <p className="font-semibold text-white">For Staff & Technicians:</p>
                <p className="text-slate-400">
                  Please contact the <strong>Business Owner</strong> to reset or reassign your password directly in <strong>Settings → Users / Staff</strong>.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <p className="font-semibold text-white">For Business Owner:</p>
                <p className="text-slate-400">
                  If you forgot your Owner password, you can reset your local account state by clearing your browser cache or re-running first-time setup.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
