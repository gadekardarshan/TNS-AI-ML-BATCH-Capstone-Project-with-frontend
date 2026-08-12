import React, { useState } from 'react';
import { MODEL_COMPARISON_METRICS, THRESHOLD_TUNING_DATA, ModelMetricRow } from '../data/projectData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart3, Award, Info, Sliders } from 'lucide-react';

export const ModelPerformance: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<keyof Omit<ModelMetricRow, 'model'>>('rocAuc');

  // Chart data format
  const chartData = MODEL_COMPARISON_METRICS.map((m) => ({
    model: m.model,
    Recall: Number((m.recall * 100).toFixed(1)),
    Precision: Number((m.precision * 100).toFixed(1)),
    'F1-Score': Number((m.f1Score * 100).toFixed(1)),
    'ROC-AUC': Number((m.rocAuc * 100).toFixed(1)),
    Specificity: Number((m.specificity * 100).toFixed(1)),
    Accuracy: Number((m.accuracy * 100).toFixed(1)),
  }));

  const metricLabels: Record<keyof Omit<ModelMetricRow, 'model'>, string> = {
    recall: 'Recall (Sensitivity)',
    precision: 'Precision',
    f1Score: 'F1-Score',
    rocAuc: 'ROC-AUC',
    specificity: 'Specificity',
    accuracy: 'Accuracy',
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-600" />
            Classification Model Comparison
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Evaluated on held-out test set (80 patient records). Hyperparameters tuned via 5-fold Stratified CV.
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
          Selected Model: Random Forest (ROC-AUC 0.764)
        </span>
      </div>

      {/* Model Metrics Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-6">
        <h3 className="text-base font-bold text-slate-900">1. Test Set Evaluation Matrix</h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Algorithm</th>
                <th className="py-3.5 px-4 text-center">Recall 🎯</th>
                <th className="py-3.5 px-4 text-center">Precision</th>
                <th className="py-3.5 px-4 text-center">F1-Score</th>
                <th className="py-3.5 px-4 text-center">ROC-AUC 🏆</th>
                <th className="py-3.5 px-4 text-center">Specificity</th>
                <th className="py-3.5 px-4 text-center">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {MODEL_COMPARISON_METRICS.map((row) => {
                const isSelected = row.model === 'Random Forest';
                return (
                  <tr
                    key={row.model}
                    className={isSelected ? 'bg-cyan-50/70 font-semibold' : 'hover:bg-slate-50'}
                  >
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      <span className="font-bold text-slate-900">{row.model}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-600 text-white">
                          SELECTED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                      {(row.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-center">{(row.precision * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-center font-semibold">{(row.f1Score * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-blue-700">
                      {(row.rocAuc * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-center">{(row.specificity * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-center font-semibold">{(row.accuracy * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Metric Comparison Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">2. Interactive Metric Comparison Chart</h3>
            <p className="text-xs text-slate-500">Visual breakdown across all 4 candidate classification models</p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full">
            {(Object.keys(metricLabels) as Array<keyof Omit<ModelMetricRow, 'model'>>).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedMetric === key
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {metricLabels[key]}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="model" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: any) => [`${val}%`, metricLabels[selectedMetric]]} />
              <Bar dataKey="Recall" fill="#10B981" radius={[4, 4, 0, 0]} name="Recall (%)" />
              <Bar dataKey="ROC-AUC" fill="#0284C7" radius={[4, 4, 0, 0]} name="ROC-AUC (%)" />
              <Bar dataKey="F1-Score" fill="#6366F1" radius={[4, 4, 0, 0]} name="F1-Score (%)" />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decision Threshold Tuning Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-cyan-600" />
          <h3 className="text-base font-bold text-slate-900">3. Random Forest Decision Threshold Tuning</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          In clinical diagnostic screening, missing a sick patient (False Negative) is significantly more costly than a false alarm (False Positive). We tuned the decision cutoff from the default <strong>0.50</strong> to <strong>0.42</strong>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">Default Cutoff (0.50)</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-800">
              <div>Recall: <strong>{(THRESHOLD_TUNING_DATA.metrics_at_default_0_5.recall * 100).toFixed(1)}%</strong></div>
              <div>Precision: <strong>{(THRESHOLD_TUNING_DATA.metrics_at_default_0_5.precision * 100).toFixed(1)}%</strong></div>
              <div>F1-Score: <strong>{(THRESHOLD_TUNING_DATA.metrics_at_default_0_5.f1 * 100).toFixed(1)}%</strong></div>
              <div>Specificity: <strong>{(THRESHOLD_TUNING_DATA.metrics_at_default_0_5.specificity * 100).toFixed(1)}%</strong></div>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2">
            <div className="text-xs font-bold text-emerald-800 uppercase flex items-center justify-between">
              <span>Tuned Cutoff (0.42)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px]">DEPLOYED</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-emerald-950">
              <div>Recall: <strong className="text-emerald-700">{(THRESHOLD_TUNING_DATA.metrics_at_threshold.recall * 100).toFixed(1)}%</strong></div>
              <div>Precision: <strong>{(THRESHOLD_TUNING_DATA.metrics_at_threshold.precision * 100).toFixed(1)}%</strong></div>
              <div>F1-Score: <strong>{(THRESHOLD_TUNING_DATA.metrics_at_threshold.f1 * 100).toFixed(1)}%</strong></div>
              <div>Specificity: <strong>{(THRESHOLD_TUNING_DATA.metrics_at_threshold.specificity * 100).toFixed(1)}%</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
