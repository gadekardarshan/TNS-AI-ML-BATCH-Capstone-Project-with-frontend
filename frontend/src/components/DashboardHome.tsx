import React, { useEffect, useState } from 'react';
import { PlusCircle, Activity, AlertTriangle, ShieldCheck, FileText, ArrowRight, RefreshCw } from 'lucide-react';
import { fetchPatientsList } from '../api/client';
import { AssessmentRecord } from '../types';

interface DashboardHomeProps {
  onStartNewAssessment: () => void;
  onSelectAssessment: (id: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onStartNewAssessment,
  onSelectAssessment,
}) => {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPatientsList(undefined, undefined, 1);
      setAssessments(data.assessments || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load dashboard assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Summary Metrics
  const highRiskCount = assessments.filter(
    (a) => a.risk_tier === 'High Risk' || a.risk_tier === 'Very High Risk'
  ).length;
  const highRiskPct = total > 0 ? Math.round((highRiskCount / assessments.length) * 100) : 0;
  const avgAgreement =
    assessments.length > 0
      ? Math.round(
          (assessments.reduce((sum, a) => sum + (a.agreement_ratio || 0.75), 0) / assessments.length) * 100
        )
      : 85;

  const getRiskBadge = (tier: string) => {
    switch (tier) {
      case 'Low Risk':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Low Risk</span>;
      case 'Moderate Risk':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Moderate Risk</span>;
      case 'High Risk':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">High Risk</span>;
      case 'Very High Risk':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">Very High Risk</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">Unknown</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 rounded-2xl p-8 text-white shadow-xl border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-3">
            Cardiology Unit Clinical Workspace
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Heart Disease Diagnostic Decision Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl">
            Real-time multi-model ensemble classification (Decision Tree, Random Forest, Logistic Regression, SVM) paired with an automated ROC-AUC validation layer and SHAP explainability.
          </p>
        </div>
        <button
          onClick={onStartNewAssessment}
          className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Patient Assessment</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patient Assessments</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{total}</p>
            <p className="text-xs text-slate-500 mt-1">Archived in database</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flagged High / Very High Risk</p>
            <p className="text-3xl font-extrabold text-orange-600 mt-1">{highRiskPct}%</p>
            <p className="text-xs text-slate-500 mt-1">{highRiskCount} patients flagged</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Model Agreement</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{avgAgreement}%</p>
            <p className="text-xs text-slate-500 mt-1">Cross-algorithm consensus</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Model Reference</p>
            <p className="text-lg font-bold text-slate-900 mt-1">Random Forest</p>
            <p className="text-xs text-cyan-600 font-semibold mt-1">ROC-AUC: 0.764 (Tuned @ 0.42)</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Assessments Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Patient Assessments</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click any row to open the complete clinical report card</p>
          </div>
          <button
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading patient assessments...</div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-semibold text-base">No patient assessments found in history.</p>
            <p className="text-xs text-slate-400 mt-1">Click "New Patient Assessment" above to run your first diagnosis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Patient Ref</th>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Final Verdict</th>
                  <th className="py-3.5 px-6">Risk Tier</th>
                  <th className="py-3.5 px-6">Agreement</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.slice(0, 8).map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => onSelectAssessment(a.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 font-bold text-slate-900">{a.patient_ref}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`font-bold ${
                          a.final_label === 'Disease Likely' ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {a.final_label}
                      </span>
                    </td>
                    <td className="py-4 px-6">{getRiskBadge(a.risk_tier)}</td>
                    <td className="py-4 px-6 font-semibold">
                      {Math.round((a.agreement_ratio || 0.75) * 100)}%
                      {a.validator_flag === 'review_recommended' && (
                        <span className="ml-2 text-xs text-red-500 font-bold">⚠️ Warning</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center space-x-1 text-cyan-600 font-semibold text-xs hover:underline">
                        <span>Report Card</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
