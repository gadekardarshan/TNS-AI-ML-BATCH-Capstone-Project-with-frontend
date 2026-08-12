import React, { useState } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardHome } from './components/DashboardHome';
import { AssessmentForm } from './components/AssessmentForm';
import { ModelPerformance } from './components/ModelPerformance';
import { DataInsights } from './components/DataInsights';
import { PatientHistory } from './components/PatientHistory';
import { ReportCardModal } from './components/ReportCardModal';
import { EnsembleResponse } from './types';
import { fetchPatientAssessment } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedAssessment, setSelectedAssessment] = useState<EnsembleResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSelectAssessment = async (id: string) => {
    try {
      const data = await fetchPatientAssessment(id);
      setSelectedAssessment(data);
      setShowModal(true);
    } catch (err) {
      alert('Failed to load assessment report detail.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <DashboardHome onNavigateToPredict={() => setActiveTab('predict')} />
        )}

        {activeTab === 'predict' && <AssessmentForm />}

        {activeTab === 'models' && <ModelPerformance />}

        {activeTab === 'insights' && <DataInsights />}

        {activeTab === 'history' && (
          <PatientHistory onSelectAssessment={handleSelectAssessment} />
        )}
      </main>

      {/* Detail Modal for Past Assessments */}
      {showModal && selectedAssessment && (
        <ReportCardModal data={selectedAssessment} onClose={() => setShowModal(false)} />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-300">
            Heart Disease Risk Prediction & ML Analytics Dashboard
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Supervised ML Classification Capstone Project • Powered by Random Forest (0.42 Tuned Threshold) & FastAPI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
