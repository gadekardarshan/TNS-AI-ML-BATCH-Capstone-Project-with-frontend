import React from 'react';
import { HeartPulse, LayoutDashboard, Stethoscope, BarChart3, PieChart, History, Activity } from 'lucide-react';
import { User } from '../types';

export type NavTab = 'overview' | 'predict' | 'models' | 'insights' | 'history';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  user?: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'predict', label: 'Predict', icon: Stethoscope },
    { id: 'models', label: 'Model Comparison', icon: BarChart3 },
    { id: 'insights', label: 'Dataset Insights', icon: PieChart },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Application Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">
                HEART DISEASE RISK PREDICTION
              </span>
              <span className="block text-[11px] text-cyan-400 font-semibold tracking-wider uppercase">
                ML Classification & Diagnostic Dashboard
              </span>
            </div>
          </div>

          {/* 5 Primary Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* System Online Status Badge */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>API Online • RF (0.42 Cutoff)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
