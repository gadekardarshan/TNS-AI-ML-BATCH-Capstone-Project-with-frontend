import axios from 'axios';
import { PatientData, EnsembleResponse, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hospital_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function loginUser(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await apiClient.post('/auth/login', { email, password });
  localStorage.setItem('hospital_auth_token', res.data.access_token);
  return { token: res.data.access_token, user: res.data.user };
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await apiClient.get('/auth/me');
  return res.data;
}

export async function runEnsemblePrediction(patient: PatientData): Promise<EnsembleResponse> {
  const res = await apiClient.post('/predict/ensemble', patient);
  return res.data;
}

export async function fetchPatientsList(search?: string, riskTier?: string, page = 1) {
  const res = await apiClient.get('/patients', {
    params: { search, risk_tier: riskTier, page, limit: 20 },
  });
  return res.data;
}

export async function fetchPatientAssessment(id: string): Promise<EnsembleResponse> {
  const res = await apiClient.get(`/patients/${id}`);
  return res.data;
}

export async function saveDoctorNotes(assessmentId: string, notes: string) {
  const res = await apiClient.post(`/patients/${assessmentId}/notes`, { doctor_notes: notes });
  return res.data;
}

export async function downloadReportPdf(payload: EnsembleResponse) {
  const res = await apiClient.post('/report/pdf', payload, {
    responseType: 'blob',
  });
  
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${payload.patient_ref}_clinical_report.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
