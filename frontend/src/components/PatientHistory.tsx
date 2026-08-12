import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, ArrowRight, RefreshCw } from 'lucide-react';
import { fetchPatientsList, fetchPatientAssessment, downloadReportPdf } from '../api/client';
import { AssessmentRecord } from '../types';

interface PatientHistoryProps {
  onSelectAssessment: (id: string) => void;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({ onSelectAssessment }) => {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [total, setTotal] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPatientsList(search || undefined, riskFilter || undefined, 1);
      setAssessments(data.assessments || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load patient history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleDownloadPdfDirect = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const fullDetail = await fetchPatientAssessment(id);
      await downloadReportPdf(fullDetail);
    } catch (err) {
      alert('Failed to download PDF report.');
    }
  };

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
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Patient Reference Code..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="">All Risk Tiers</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Moderate Risk">Moderate Risk</option>
              <option value="High Risk">High Risk</option>
              <option value="Very High Risk">Very High Risk</option>
            </select>
          </div>

          <button
            onClick={loadData}
            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Assessment History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Assessment Logs ({total})</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading patient assessment history...</div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-semibold text-base">No matching patient records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Patient Ref</th>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Prediction Verdict</th>
                  <th className="py-3.5 px-6">Risk Tier</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {assessments.map((a) => (
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
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={(e) => handleDownloadPdfDirect(e, a.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                      <span className="inline-flex items-center space-x-1 text-cyan-600 font-semibold text-xs hover:underline">
                        <span>Detail</span>
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
