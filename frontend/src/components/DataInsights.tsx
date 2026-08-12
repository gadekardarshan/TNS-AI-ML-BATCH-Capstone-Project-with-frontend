import React from 'react';
import { EDA_INSIGHTS } from '../data/projectData';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PieChart as PieIcon, Database, Activity, FileSpreadsheet } from 'lucide-react';

export const DataInsights: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-6 h-6 text-cyan-600" />
            Dataset & Exploratory Data Analysis (EDA) Insights
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Exploratory analysis on the reference dataset (`heart_disease_dataset`) comprising 400 patient records.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
          <Database className="w-4 h-4 text-cyan-600" />
          <span>400 Records • 13 Features • 0 Missing Values</span>
        </div>
      </div>

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Patients</span>
          <p className="text-2xl font-extrabold text-slate-900">{EDA_INSIGHTS.n_records}</p>
          <p className="text-xs text-slate-500 font-medium">Complete records</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Input Features</span>
          <p className="text-2xl font-extrabold text-slate-900">{EDA_INSIGHTS.n_features}</p>
          <p className="text-xs text-slate-500 font-medium">Clinical & Diagnostic</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Class Balance Ratio</span>
          <p className="text-2xl font-extrabold text-blue-600">{EDA_INSIGHTS.class_balance_ratio}</p>
          <p className="text-xs text-slate-500 font-medium">Mild balance (55.5% : 44.5%)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Missing Data</span>
          <p className="text-2xl font-extrabold text-emerald-600">0</p>
          <p className="text-xs text-slate-500 font-medium">100% complete data</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target Class Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">1. Target Variable Class Distribution</h3>
            <p className="text-xs text-slate-500">Distribution of target `heart_disease` (0 = No Disease, 1 = Disease Present)</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={EDA_INSIGHTS.target_distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  label={({ name, percentage }) => `${name.split(' ')[0]}: ${percentage}%`}
                >
                  {EDA_INSIGHTS.target_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} Patients`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-900 block">Class 0: No Disease</span>
              <span className="text-lg font-black text-emerald-700">178 patients (44.5%)</span>
            </div>
            <div className="bg-red-50 p-3 rounded-xl border border-red-200">
              <span className="font-bold text-red-900 block">Class 1: Heart Disease</span>
              <span className="text-lg font-black text-red-700">222 patients (55.5%)</span>
            </div>
          </div>
        </div>

        {/* Feature Correlation Rankings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">2. Top Feature Correlations with Heart Disease</h3>
            <p className="text-xs text-slate-500">Pearson correlation coefficients with target variable</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={EDA_INSIGHTS.top_correlated_features}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" domain={[-0.4, 0.4]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip formatter={(val: any) => [Number(val).toFixed(3), 'Correlation Coefficient']} />
                <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
                  {EDA_INSIGHTS.top_correlated_features.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.correlation > 0 ? '#EF4444' : '#0284C7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <strong className="text-slate-900 font-bold block mb-1">Key Correlation Takeaways:</strong>
            Higher Age (+0.341) and Resting BP (+0.218) correlate positively with risk, whereas higher Maximum Heart Rate (-0.328) correlates negatively with heart disease.
          </div>
        </div>
      </div>
    </div>
  );
};
