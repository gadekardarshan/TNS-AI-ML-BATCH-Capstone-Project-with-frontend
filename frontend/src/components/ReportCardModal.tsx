import React, { useState } from 'react';
import { EnsembleResponse } from '../types';
import { downloadReportPdf, saveDoctorNotes } from '../api/client';
import { X, Download, AlertTriangle, ShieldCheck, Heart, Save, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ReportCardModalProps {
  data: EnsembleResponse;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({ data, onClose }) => {
  const [doctorNotes, setDoctorNotes] = useState(data.doctor_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [noteSavedMessage, setNoteSavedMessage] = useState(false);

  const consensus = data.consensus;
  const isHighRisk = consensus.risk_tier === 'High Risk' || consensus.risk_tier === 'Very High Risk';

  // Format SHAP factors for Recharts
  const rfModel = data.model_results.find((m) => m.model_name === 'Random Forest');
  const shapData = (rfModel?.top_contributing_factors || []).map((f) => ({
    feature: f.feature,
    impact: f.impact,
    direction: f.direction,
    color: f.impact > 0 ? '#EF4444' : '#3B82F6',
  }));

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await saveDoctorNotes(data.assessment_id, doctorNotes);
      setNoteSavedMessage(true);
      setTimeout(() => setNoteSavedMessage(false), 3000);
    } catch (err) {
      alert('Failed to save notes to server.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadReportPdf({ ...data, doctor_notes: doctorNotes });
    } catch (err) {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getRiskBadgeClass = (tier: string) => {
    switch (tier) {
      case 'Low Risk':
        return 'bg-emerald-500 text-white shadow-emerald-500/30';
      case 'Moderate Risk':
        return 'bg-amber-500 text-white shadow-amber-500/30';
      case 'High Risk':
        return 'bg-orange-500 text-white shadow-orange-500/30';
      case 'Very High Risk':
        return 'bg-red-600 text-white shadow-red-600/30';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">
              Clinical Diagnostic Report Card
            </span>
            <h2 className="text-2xl font-extrabold flex items-center gap-2 mt-0.5">
              <span>Patient Ref: {data.patient_ref}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Assessment ID: {data.assessment_id} • Date: {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center space-x-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          {/* Verdict Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Final Consensus Verdict</div>
              <div className={`text-2xl font-black mt-1 ${consensus.final_prediction === 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                {consensus.final_label.toUpperCase()}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Weighted Confidence: <span className="font-bold text-white">{Math.round(consensus.confidence_score * 100)}%</span> • {consensus.agreement_note}
              </div>
            </div>

            <div className={`px-5 py-2.5 rounded-xl font-extrabold text-sm shadow-lg ${getRiskBadgeClass(consensus.risk_tier)}`}>
              {consensus.risk_tier.toUpperCase()}
            </div>
          </div>

          {/* Validator Warning Banner (Disagreement Flag) */}
          {consensus.validator_flag === 'review_recommended' && (
            <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-2xl flex items-start space-x-3 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-red-900 uppercase tracking-wider">
                  ⚠️ Clinical Disagreement Warning
                </h4>
                <p className="text-xs text-red-800 font-medium mt-1">
                  {consensus.validator_warning || 'Models disagree significantly. Clinical judgment is strongly advised; do not rely solely on automated verdict.'}
                </p>
              </div>
            </div>
          )}

          {/* 4-Model Breakdown Table */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              1. Multi-Model Classifier Breakdown
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Algorithm</th>
                    <th className="py-3 px-4">Prediction</th>
                    <th className="py-3 px-4">Probability</th>
                    <th className="py-3 px-4">Risk Tier Status</th>
                    <th className="py-3 px-4">ROC-AUC Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {data.model_results.map((m) => {
                    const isDisagreed = m.prediction !== consensus.final_prediction;
                    return (
                      <tr key={m.model_name} className={isDisagreed ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{m.model_name}</span>
                          {isDisagreed && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                              ⚠️ Disagrees
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${m.prediction === 1 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {m.prediction_label}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold">{Math.round(m.probability * 100)}%</td>
                        <td className="py-3 px-4">{m.risk_tier}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {m.model_name === 'Random Forest' ? '0.764 (Primary)' : m.model_name === 'Logistic Regression' ? '0.739' : m.model_name === 'SVM' ? '0.728' : '0.668'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SHAP Explainability Bar Chart */}
          {shapData.length > 0 && (
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                2. Explainability Drivers (Random Forest SHAP Values)
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shapData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                      <XAxis type="number" tickFormatter={(val) => val.toFixed(3)} />
                      <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fontWeight: 600 }} />
                      <Tooltip
                        formatter={(val: any) => [Number(val).toFixed(4), 'SHAP Value']}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                        {shapData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center space-x-6 text-xs font-semibold text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Increases Disease Risk</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Decreases Disease Risk</span>
                </div>
              </div>
            </div>
          )}

          {/* Patient Input Summary 2-Column Grid */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">
              3. Submitted Patient Clinical Inputs
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              {Object.entries(data.input_summary).map(([key, val]) => (
                <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{key.replace(/_/g, ' ')}</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{String(val)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Clinical Recommendation Box */}
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-blue-900">
              Recommended Clinical Action Protocol
            </h4>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {consensus.recommended_action}
            </p>
          </div>

          {/* Doctor Notes Field */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                Attending Physician Clinical Notes
              </label>
              {noteSavedMessage && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved to server
                </span>
              )}
            </div>

            <textarea
              rows={3}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Add physician diagnostic notes, follow-up instructions, or observations..."
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-500"
            />

            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingNotes ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>

          {/* Regulatory Disclaimer */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-700">CLINICAL DECISION SUPPORT DISCLAIMER:</strong> This report is generated by an automated machine learning ensemble decision-support system. It is NOT an FDA/CE-cleared primary diagnostic device. Final diagnostic decisions and patient management remain the sole responsibility of the attending licensed physician.
          </div>
        </div>
      </div>
    </div>
  );
};
