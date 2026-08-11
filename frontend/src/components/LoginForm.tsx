import React, { useState } from 'react';
import { Activity, Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';
import { loginUser } from '../api/client';
import { User } from '../types';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('doctor@hospital.org');
  const [password, setPassword] = useState('Doctor123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(email, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 mb-4">
            <Activity className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Physician Portal Sign In
          </h2>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            St. Jude Cardiovascular Center • Decision Support System
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3.5 rounded-xl">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Hospital Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm text-slate-900 font-medium"
                placeholder="doctor@hospital.org"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm text-slate-900 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-medium mb-1">Demo Access Credentials Pre-Filled:</p>
          <code className="text-xs bg-slate-200 text-slate-800 px-2 py-1 rounded font-mono">
            doctor@hospital.org / Doctor123!
          </code>
        </div>
      </div>
    </div>
  );
};
