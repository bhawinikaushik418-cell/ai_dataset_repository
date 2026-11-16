import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Database, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
            <Database size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back to AIXplore
          </h2>
          <p className="text-xs text-slate-500 mt-1.5">
            Log in to manage datasets, submit access requests, and rate benchmarks
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Academic Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@aixplore.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Account Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Verifying Credentials...' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Helper for Evaluators */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Demo Credentials (PBL Evaluation)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('admin@aixplore.edu', 'Admin@12345')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors text-center"
            >
              Fill <span className="font-bold text-indigo-600">Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('alice@aixplore.edu', 'User@12345')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors text-center"
            >
              Fill <span className="font-bold text-brand-600">Student</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
