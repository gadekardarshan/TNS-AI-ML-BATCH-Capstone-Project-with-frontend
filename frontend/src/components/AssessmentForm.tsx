import React, { useState } from 'react';
import { PatientData } from '../types';
import { Play, Upload, Sparkles, AlertCircle, Info, Heart, Activity, User, ShieldCheck } from 'lucide-react';

interface AssessmentFormProps {
  onSubmit: (data: PatientData) => void;
}

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
  patient_ref: 'PAT-DEMO-58M',
};

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<PatientData>(SAMPLE_PATIENT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any): string => {
    const val = Number(value);
    switch (name) {
      case 'age':
        if (isNaN(val) || val < 1 || val > 120) return 'Age must be between 1 and 120 years';
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
    const parsedValue = name === 'st_depression' ? parseFloat(value) : (name === 'patient_ref' ? value : parseInt(value, 10));

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
          // Simple CSV parser for 1 line
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
        alert('Failed to parse uploaded file. Please ensure valid JSON or CSV format.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check all validations
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((k) => {
      const err = validateField(k, (formData as any)[k]);
      if (err) newErrors[k] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500/20" />
            New Patient Diagnostic Assessment
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter 13 diagnostic parameters below to run 4-model ensemble prediction with ROC-AUC consensus validation.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Ref Code */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
            Patient Reference Identifier
          </label>
          <input
            type="text"
            name="patient_ref"
            value={formData.patient_ref || ''}
            onChange={handleChange}
            placeholder="e.g. PAT-2026-8842"
            className="w-full max-w-md px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Section 1: Demographics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-cyan-600" />
            <h3 className="text-base font-bold text-slate-900">1. Patient Demographics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              />
              {errors.age && <p className="text-xs text-red-500 mt-1 font-medium">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biological Sex <span className="text-red-500">*</span>
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
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
            <h3 className="text-base font-bold text-slate-900">2. Vitals & Serum Diagnostics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resting Blood Pressure (mm Hg)
              </label>
              <input
                type="number"
                name="resting_blood_pressure"
                value={formData.resting_blood_pressure}
                onChange={handleChange}
                min={60}
                max={250}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              />
              {errors.resting_blood_pressure && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.resting_blood_pressure}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serum Cholesterol (mg/dl)
              </label>
              <input
                type="number"
                name="cholesterol"
                value={formData.cholesterol}
                onChange={handleChange}
                min={100}
                max={600}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              />
              {errors.cholesterol && <p className="text-xs text-red-500 mt-1 font-medium">{errors.cholesterol}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fasting Blood Sugar &gt; 120 mg/dl
              </label>
              <select
                name="fasting_blood_sugar"
                value={formData.fasting_blood_sugar}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value={0}>False / Normal (0)</option>
                <option value={1}>True / Elevated &gt; 120 mg/dl (1)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: ECG & Exercise Test */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Heart className="w-5 h-5 text-cyan-600" />
            <h3 className="text-base font-bold text-slate-900">3. Electrocardiogram & Exercise Stress Test</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resting ECG Results</label>
              <select
                name="resting_ecg"
                value={formData.resting_ecg}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value={0}>0 = Normal</option>
                <option value={1}>1 = ST-T Wave Abnormality</option>
                <option value={2}>2 = Left Ventricular Hypertrophy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Heart Rate Achieved (bpm)</label>
              <input
                type="number"
                name="max_heart_rate"
                value={formData.max_heart_rate}
                onChange={handleChange}
                min={60}
                max={250}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              />
              {errors.max_heart_rate && <p className="text-xs text-red-500 mt-1 font-medium">{errors.max_heart_rate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exercise-Induced Angina</label>
              <select
                name="exercise_induced_angina"
                value={formData.exercise_induced_angina}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value={0}>No (0)</option>
                <option value={1}>Yes (1)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ST Depression (exercise vs rest)
              </label>
              <input
                type="number"
                step="0.1"
                name="st_depression"
                value={formData.st_depression}
                onChange={handleChange}
                min={0}
                max={10}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              />
              {errors.st_depression && <p className="text-xs text-red-500 mt-1 font-medium">{errors.st_depression}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ST Slope (peak exercise)</label>
              <select
                name="st_slope"
                value={formData.st_slope}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value={0}>0 = Upsloping</option>
                <option value={1}>1 = Flat</option>
                <option value={2}>2 = Downsloping</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Structural & Anatomical Indicators */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-cyan-600" />
            <h3 className="text-base font-bold text-slate-900">4. Structural & Angiographic Indicators</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chest Pain Type</label>
              <select
                name="chest_pain_type"
                value={formData.chest_pain_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value={0}>0 = Typical Angina</option>
                <option value={1}>1 = Atypical Angina</option>
                <option value={2}>2 = Non-Anginal Pain</option>
                <option value={3}>3 = Asymptomatic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Major Vessels (Fluoroscopy)</label>
              <select
                name="num_major_vessels"
                value={formData.num_major_vessels}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value={0}>0 Major Vessels</option>
                <option value={1}>1 Major Vessel</option>
                <option value={2}>2 Major Vessels</option>
                <option value={3}>3 Major Vessels</option>
                <option value={4}>4 Major Vessels</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thalassemia Status</label>
              <select
                name="thalassemia"
                value={formData.thalassemia}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value={0}>0 = Normal</option>
                <option value={1}>1 = Fixed Defect</option>
                <option value={2}>2 = Reversible Defect</option>
                <option value={3}>3 = Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-cyan-600/30 transition-all hover:scale-[1.01]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Run Multi-Model Ensemble Diagnostic</span>
          </button>
        </div>
      </form>
    </div>
  );
};
