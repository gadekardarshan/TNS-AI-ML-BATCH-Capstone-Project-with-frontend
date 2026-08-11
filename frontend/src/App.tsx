import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginForm } from './components/LoginForm';
import { DashboardHome } from './components/DashboardHome';
import { AssessmentForm } from './components/AssessmentForm';
import { LiveProgress } from './components/LiveProgress';
import { ReportCardModal } from './components/ReportCardModal';
import { PatientHistory } from './components/PatientHistory';
import { PatientData, EnsembleResponse, User } from './types';
import { runEnsemblePrediction, fetchPatientAssessment, fetchCurrentUser } from './api/client';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assessment' | 'history'>('dashboard');

  const [executing, setExecuting] = useState(false);
  const [currentResult, setCurrentResult] = useState<EnsembleResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('hospital_auth_token');
    if (token) {
      fetchCurrentUser()
        .then((u) => {
          setUser(u);
          setAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('hospital_auth_token');
        });
    }
  }, []);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('hospital_auth_token');
    setUser(null);
    setAuthenticated(false);
  };

  const handleFormSubmit = async (formData: PatientData) => {
    setExecuting(true);
    try {
      const result = await runEnsemblePrediction(formData);
      setCurrentResult(result);
    } catch (err) {
      alert('Failed to execute ensemble prediction. Check backend status.');
      setExecuting(false);
    }
  };

  const handleProgressComplete = () => {
    setExecuting(false);
    setShowModal(true);
  };

  const handleSelectAssessment = async (id: string) => {
    try {
      const data = await fetchPatientAssessment(id);
      setCurrentResult(data);
      setShowModal(true);
    } catch (err) {
      alert('Failed to load assessment report detail.');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800">
          St. Jude Cardiovascular Center • Clinical AI Diagnostic Decision-Support Portal
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {executing ? (
          <LiveProgress onComplete={handleProgressComplete} />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardHome
                onStartNewAssessment={() => setActiveTab('assessment')}
                onSelectAssessment={handleSelectAssessment}
              />
            )}

            {activeTab === 'assessment' && (
              <AssessmentForm onSubmit={handleFormSubmit} />
            )}

            {activeTab === 'history' && (
              <PatientHistory onSelectAssessment={handleSelectAssessment} />
            )}
          </>
        )}
      </main>

      {/* Report Card Modal */}
      {showModal && currentResult && (
        <ReportCardModal data={currentResult} onClose={() => setShowModal(false)} />
      )}

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-300">St. Jude Cardiovascular Center • AI Decision Support System v2.0</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Research prototype for clinical decision support. Final diagnostic responsibility remains with the attending physician.
        </p>
      </footer>
    </div>
  );
};
export default App;
