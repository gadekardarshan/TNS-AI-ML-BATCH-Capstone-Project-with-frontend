import React from 'react';
import { Activity, PlusCircle, History, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: 'dashboard' | 'assessment' | 'history';
  setActiveTab: (tab: 'dashboard' | 'assessment' | 'history') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                ST. JUDE CARDIOVASCULAR
              </span>
              <span className="block text-xs text-cyan-400 font-medium tracking-wide uppercase">
                Clinical AI Diagnostic Suite
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'assessment'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Assessment</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Patient History</span>
            </button>
          </nav>

          {/* Physician Profile & Logout */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200">{user.full_name}</div>
                  <div className="text-[10px] text-cyan-400 font-medium">{user.role}</div>
                </div>
              </div>
            )}

            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
