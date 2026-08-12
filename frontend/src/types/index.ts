export interface PatientData {
  age: number;
  sex: number;
  chest_pain_type: number;
  resting_blood_pressure: number;
  cholesterol: number;
  fasting_blood_sugar: number;
  resting_ecg: number;
  max_heart_rate: number;
  exercise_induced_angina: number;
  st_depression: number;
  st_slope: number;
  num_major_vessels: number;
  thalassemia: number;
  patient_ref?: string;
  patient_name?: string;
}

export interface ShapFactor {
  feature: string;
  impact: number;
  direction: 'increases risk' | 'decreases risk' | 'neutral';
}

export interface ModelResult {
  model_name: string;
  prediction: number;
  prediction_label: string;
  probability: number;
  risk_tier: string;
  status?: 'success' | 'error';
  error_message?: string;
  top_contributing_factors?: ShapFactor[];
}

export interface ConsensusResult {
  final_prediction: number;
  final_label: string;
  confidence_score: number;
  agreement_ratio: number;
  agreement_note: string;
  validator_flag: 'none' | 'review_recommended';
  validator_warning?: string;
  risk_tier: string;
  recommended_action: string;
  color_code?: string;
  primary_model_reference: string;
  partial_failure?: boolean;
}

export interface EnsembleResponse {
  assessment_id: string;
  patient_ref: string;
  patient_name?: string;
  timestamp: string;
  input_summary: PatientData;
  model_results: ModelResult[];
  consensus: ConsensusResult;
  doctor_notes?: string;
}

export interface AssessmentRecord {
  id: string;
  patient_ref: string;
  timestamp: string;
  final_label: string;
  risk_tier: string;
  confidence_score: number;
  agreement_ratio: number;
  validator_flag: string;
  doctor_notes?: string;
}

export interface User {
  email: string;
  full_name: string;
  role: string;
}
