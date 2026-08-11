import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Loader2, ShieldCheck, Cpu } from 'lucide-react';

interface LiveProgressProps {
  onComplete: () => void;
}

export const LiveProgress: React.FC<LiveProgressProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { name: 'Decision Tree Classifier', desc: 'Evaluating split rules & leaf nodes...' },
    { name: 'Random Forest Ensemble', desc: 'Averaging 200 decision trees & computing SHAP...' },
    { name: 'Logistic Regression', desc: 'Evaluating linear probability boundaries...' },
    { name: 'Support Vector Machine (SVM)', desc: 'Applying RBF kernel margin scoring...' },
    { name: 'ROC-AUC Consensus Validator', desc: 'Weighing models & assessing disagreement spread...' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return prev;
        }
      });
    }, 600);

    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="max-w-2xl mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-100 text-cyan-600 mb-3 animate-pulse">
          <Cpu className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">Running Multi-Model Inference Pipeline</h3>
        <p className="text-xs text-slate-500 mt-1">Executing 4 base models simultaneously + ROC-AUC consensus validator</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={step.name}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                isDone
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : isCurrent
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-950 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-cyan-600 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-bold">{step.name}</p>
                  <p className="text-xs opacity-75">{step.desc}</p>
                </div>
              </div>

              {isDone && <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">Completed</span>}
              {isCurrent && <span className="text-xs font-bold text-cyan-700 bg-cyan-100 px-2.5 py-1 rounded-full animate-pulse">Processing...</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
