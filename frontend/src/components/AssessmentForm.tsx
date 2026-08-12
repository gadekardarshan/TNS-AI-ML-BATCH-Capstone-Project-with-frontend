import React, { useState } from 'react';
import { PatientData, EnsembleResponse } from '../types';
import { runEnsemblePrediction } from '../api/client';
import { Play, Sparkles, Upload, Heart, Activity, User, ShieldCheck, HelpCircle, Loader2, AlertTriangle, CheckCircle2, FileText, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SAMPLE_PATIENT: PatientData = {
  age: 58,
  sex: 1,
  chest_pain_type: 1,
  resting_blood_pressure: 130,
  cholesterol: 220,
  fasting_blood_sugar: 0,
  resting_ecg: 1,
  max_heart_rate: 150,
  exercise_induced_angina: 0,
  st_depression: 1.2,
  st_slope: 1,
  num_major_vessels: 0,
  thalassemia: 2,
  patient_ref: 'PAT-58M-DEMO',
};

export const AssessmentForm: React.FC = () => {
  const [formData, setFormData] = useState<PatientData>(SAMPLE_PATIENT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<EnsembleResponse | null>(null);

  const validateField = (name: string, value: any): string => {
    const val = Number(value);
    switch (name) {
      case 'age':
        if (isNaN(val) || val < 1 || val > 120) return 'Age must be between 1 and 120';
        break;
      case 'resting_blood_pressure':
        if (isNaN(val) || val < 60 || val > 250) return 'Resting BP must be between 60 and 250 mm Hg';
        break;
      case 'cholesterol':
        if (isNaN(val) || val < 100 || val > 600) return 'Cholesterol must be between 100 and 600 mg/dl';
        break;
      case 'max_heart_rate':
        if (isNaN(val) || val < 60 || val > 250) return 'Max Heart Rate must be between 60 and 250 bpm';
        break;
      case 'st_depression':
        if (isNaN(val) || val < 0 || val > 10) return 'ST Depression must be between 0.0 and 10.0';
        break;
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsedValue = name === 'st_depression' ? parseFloat(value) : name === 'patient_ref' ? value : parseInt(value, 10);

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));

    const err = validateField(name, parsedValue);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleLoadSample = () => {
    setFormData(SAMPLE_PATIENT);
    setErrors({});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          setFormData((prev) => ({ ...prev, ...json }));
        } else {
          const lines = text.split('\n');
          if (lines.length >= 2) {
            const headers = lines[0].split(',').map((h) => h.trim());
            const values = lines[1].split(',').map((v) => v.trim());
            const obj: any = {};
            headers.forEach((h, idx) => {
              if (h in SAMPLE_PATIENT) {
                obj[h] = h === 'st_depression' ? parseFloat(values[idx]) : parseInt(values[idx], 10);
              }
            });
            setFormData((prev) => ({ ...prev, ...obj }));
          }
        }
      } catch (err) {
        alert('Failed to parse uploaded file. Ensure valid JSON or CSV format.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((k) => {
      const err = validateField(k, (formData as any)[k]);
      if (err) newErrors[k] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await runEnsemblePrediction(formData);
      setPredictionResult(result);
    } catch (err) {
      alert('Failed to connect to backend prediction service.');
    } finally {
      setLoading(false);
    }
  };

  // Format SHAP data for chart
  const rfModel = predictionResult?.model_results?.find((m) => m.model_name === 'Random Forest');
  const shapFactors = rfModel?.top_contributing_factors || [];
  const shapChartData = shapFactors.map((f) => ({
    feature: f.feature,
    impact: f.impact,
    color: f.impact > 0 ? '#EF4444' : '#0284C7',
  }));

  const getRiskBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'Low Risk':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Moderate Risk':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'High Risk':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Very High Risk':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500/20" />
            Patient Heart Disease Assessment
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter 13 clinical test features below to receive real-time Random Forest risk prediction & SHAP explainability.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-3.5 py-2.5 rounded-xl transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>Load Sample Patient</span>
          </button>

          <label className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Upload JSON/CSV</span>
            <input type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Responsive 2-Column Layout for Desktop (Form Left, Result Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* Section 1: Demographics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Patient Demographics</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age (years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min={1}
                  max={120}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                />
                {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biological Sex <span className="text-red-500">*</span>
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value={1}>Male (1)</option>
                  <option value={0}>Female (0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Vitals & Blood Chemistry */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Activity className="w-5 h-5 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Cardiovascular Vitals</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resting BP (mm Hg)</label>
                <input
                  type="number"
                  name="resting_blood_pressure"
                  value={formData.resting_blood_pressure}
                  onChange={handleChange}
                  min={60}
                  max={250}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                />
                {errors.resting_blood_pressure && <p className="text-xs text-red-500 mt-1">{errors.resting_blood_pressure}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cholesterol (mg/dl)</label>
                <input
                  type="number"
                  name="cholesterol"
                  value={formData.cholesterol}
                  onChange={handleChange}
                  min={100}
                  max={600}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                />
                {errors.cholesterol && <p className="text-xs text-red-500 mt-1">{errors.cholesterol}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fasting Sugar &gt; 120 mg/dl</label>
                <select
                  name="fasting_blood_sugar"
                  value={formData.fasting_blood_sugar}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value={0}>No / Normal (0)</option>
                  <option value={1}>Yes / High (1)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Test Results */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Diagnostic & ECG Test Results</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Chest Pain Type</span>
                  <span className="text-[10px] text-slate-400 font-normal">Symptom classification</span>
                </label>
                <select
                  name="chest_pain_type"
                  value={formData.chest_pain_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value={0}>0 = Typical Angina (Chest pressure)</option>
                  <option value={1}>1 = Atypical Angina (Atypical symptoms)</option>
                  <option value={2}>2 = Non-Anginal Pain (Non-cardiac)</option>
                  <option value={3}>3 = Asymptomatic (No pain)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resting ECG Results</label>
                <select
                  name="resting_ecg"
                  value={formData.resting_ecg}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value={0}>0 = Normal</option>
                  <option value={1}>1 = ST-T Wave Abnormality</option>
                  <option value={2}>2 = Left Ventricular Hypertrophy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Heart Rate (bpm)</label>
                <input
                  type="number"
                  name="max_heart_rate"
                  value={formData.max_heart_rate}
                  onChange={handleChange}
                  min={60}
                  max={250}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                />
                {errors.max_heart_rate && <p className="text-xs text-red-500 mt-1">{errors.max_heart_rate}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exercise-Induced Angina</label>
                <select
                  name="exercise_induced_angina"
                  value={formData.exercise_induced_angina}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value={0}>No (0)</option>
                  <option value={1}>Yes (1)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ST Depression (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="st_depression"
                  value={formData.st_depression}
                  onChange={handleChange}
                  min={0}
                  max={10}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Exercise vs rest ST segment drop</span>
                {errors.st_depression && <p className="text-xs text-red-500 mt-1">{errors.st_depression}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ST Slope (peak exercise)</label>
                <select
                  name="st_slope"
                  value={formData.st_slope}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value={0}>0 = Upsloping</option>
                  <option value={1}>1 = Flat</option>
                  <option value={2}>2 = Downsloping</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Major Vessels (Fluoroscopy)</label>
                <select
                  name="num_major_vessels"
                  value={formData.num_major_vessels}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value={0}>0 Vessels Colored</option>
                  <option value={1}>1 Vessel Colored</option>
                  <option value={2}>2 Vessels Colored</option>
                  <option value={3}>3 Vessels Colored</option>
                  <option value={4}>4 Vessels Colored</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Thalassemia Status</label>
                <select
                  name="thalassemia"
                  value={formData.thalassemia}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value={0}>0 = Normal</option>
                  <option value={1}>1 = Fixed Defect</option>
                  <option value={2}>2 = Reversible Defect</option>
                  <option value={3}>3 = Other</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Running Prediction...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Submit & Run Risk Prediction</span>
              </>
            )}
          </button>
        </form>

        {/* Prediction Result Right Column */}
        <div className="lg:col-span-5 space-y-6">
          {!predictionResult ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-400 space-y-3 min-h-[400px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                <BarChart2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-700 text-base">Prediction Output Pending</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Fill out the 13 clinical fields on the left and click "Run Risk Prediction" to display the model result & SHAP factors.
              </p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
              {/* Verdict Header */}
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Diagnostic Prediction Output
                </span>
                <div className="flex items-center justify-between mt-1">
                  <h3
                    className={`text-2xl font-black ${
                      predictionResult.consensus.final_prediction === 1 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {predictionResult.consensus.final_label}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getRiskBadgeColor(
                      predictionResult.consensus.risk_tier
                    )}`}
                  >
                    {predictionResult.consensus.risk_tier}
                  </span>
                </div>
              </div>

              {/* Probability Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Disease Probability Score</span>
                  <span className="text-slate-900 font-extrabold">
                    {(predictionResult.consensus.confidence_score * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      predictionResult.consensus.confidence_score >= 0.42 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${predictionResult.consensus.confidence_score * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Low Risk (&lt; 35%)</span>
                  <span>Threshold Cutoff (42%)</span>
                  <span>High Risk (&gt; 75%)</span>
                </div>
              </div>

              {/* Model & Cutoff Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Model Used</span>
                  <span className="font-bold text-slate-900">Random Forest</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tuned Cutoff</span>
                  <span className="font-bold text-slate-900">0.42 Threshold</span>
                </div>
              </div>

              {/* SHAP Feature Contribution Chart */}
              {shapChartData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-cyan-600" />
                    Top Influential Factors (SHAP Values)
                  </h4>

                  <div className="h-44 w-full bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={shapChartData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="feature" tick={{ fontSize: 10, fontWeight: 600 }} />
                        <Tooltip formatter={(val: any) => [Number(val).toFixed(4), 'SHAP Value']} />
                        <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                          {shapChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Clinical Action Recommendation */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <span className="font-bold uppercase tracking-wider block text-[10px]">Recommended Protocol</span>
                <p className="font-semibold text-slate-900">{predictionResult.consensus.recommended_action}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
