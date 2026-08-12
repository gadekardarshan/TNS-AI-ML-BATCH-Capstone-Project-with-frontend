import React from 'react';
import { Database, Cpu, Target, CheckCircle2, ArrowRight, Activity, Award } from 'lucide-react';
import { EDA_INSIGHTS, MODEL_COMPARISON_METRICS, THRESHOLD_TUNING_DATA } from '../data/projectData';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface OverviewProps {
  onNavigateToPredict: () => void;
}

export const DashboardHome: React.FC<OverviewProps> = ({ onNavigateToPredict }) => {
  const rfMetrics = MODEL_COMPARISON_METRICS.find((m) => m.model === 'Random Forest')!;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Activity className="w-3.5 h-3.5" />
            <span>Supervised ML Classification Project</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Heart Disease Detection & Analytics Platform
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Predict patient heart disease risk using clinical test features. Powered by a Random Forest model tuned to a recall-optimized decision threshold of 0.42.
          </p>
        </div>

        <button
          onClick={onNavigateToPredict}
          className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] flex-shrink-0"
        >
          <span>Start Patient Assessment</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Dataset Records</span>
            <Database className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{EDA_INSIGHTS.n_records}</p>
          <p className="text-xs text-slate-500 font-medium">13 Features + 1 Target</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Deployed Model</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">Random Forest</p>
          <p className="text-xs text-slate-500 font-medium">Selected over DT, LogReg, SVM</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Decision Cutoff</span>
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{THRESHOLD_TUNING_DATA.chosen_threshold}</p>
          <p className="text-xs text-slate-500 font-medium">Tuned from 0.50 (Recall: 95.5%)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">System Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">API Operational</p>
          <p className="text-xs text-slate-500 font-medium">FastAPI Endpoint Active</p>
        </div>
      </div>

      {/* Overview Grid: Target Distribution + Deployed Model Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dataset Distribution Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Dataset Target Class Balance</h3>
            <p className="text-xs text-slate-500">Distribution of 400 patient records in reference dataset</p>
          </div>

          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={EDA_INSIGHTS.target_distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
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
              <span className="font-bold text-emerald-900 block">No Disease (0)</span>
              <span className="text-lg font-black text-emerald-700">178 patients</span>
              <span className="block text-[10px] text-emerald-600 mt-0.5">44.5% of dataset</span>
            </div>
            <div className="bg-red-50 p-3 rounded-xl border border-red-200">
              <span className="font-bold text-red-900 block">Heart Disease (1)</span>
              <span className="text-lg font-black text-red-700">222 patients</span>
              <span className="block text-[10px] text-red-600 mt-0.5">55.5% of dataset</span>
            </div>
          </div>
        </div>

        {/* Deployed Model Performance Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Deployed Model Metrics</h3>
              <p className="text-xs text-slate-500">Test set evaluation (80 held-out patients)</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Random Forest
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">ROC-AUC Score</span>
              <span className="text-2xl font-black text-slate-900">{(rfMetrics.rocAuc * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Highest across models</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Test Accuracy</span>
              <span className="text-2xl font-black text-slate-900">{(rfMetrics.accuracy * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Default threshold 0.50</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tuned Sensitivity</span>
              <span className="text-2xl font-black text-emerald-600">{(THRESHOLD_TUNING_DATA.metrics_at_threshold.recall * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Recall at 0.42 cutoff</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">F1-Score</span>
              <span className="text-2xl font-black text-slate-900">{(rfMetrics.f1Score * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Balanced metric</span>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-slate-700">
            <strong className="text-blue-900 font-bold block mb-1">Model Selection Rationale:</strong>
            Random Forest was selected over Decision Tree, Logistic Regression, and SVM due to its superior ROC-AUC score (0.764) and balanced performance across recall and specificity.
          </div>
        </div>
      </div>
    </div>
  );
};
