import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { TestWorkspacePage } from './pages/TestWorkspacePage';
import { AnalysisResultsPage } from './pages/AnalysisResultsPage';
import { ExecutionHistoryPage } from './pages/ExecutionHistoryPage';
import type { ExecutionResultData } from './types/evolyn';

const STORAGE_KEY_LAST_RESULT = 'evolyn_last_execution_result';

export const App: React.FC = () => {
  const [lastResult, setLastResult] = useState<ExecutionResultData | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_LAST_RESULT);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleExecutionComplete = (result: ExecutionResultData) => {
    setLastResult(result);
    try {
      sessionStorage.setItem(STORAGE_KEY_LAST_RESULT, JSON.stringify(result));
    } catch {
      // ignore storage quota issues
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <TestWorkspacePage
                  onExecutionComplete={handleExecutionComplete}
                  lastResult={lastResult}
                />
              }
            />
            <Route
              path="/results"
              element={<AnalysisResultsPage result={lastResult} />}
            />
            <Route
              path="/history"
              element={
                <ExecutionHistoryPage
                  onSelectSubmissionForInspection={handleExecutionComplete}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="font-semibold text-slate-700">Evolyn Brand Governance Test Client</p>
              <p className="text-[11px] text-slate-400">
                Lightweight harness strictly querying verified Evolyn backend endpoints.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span>GET /health</span>
              <span>•</span>
              <span>POST /api/submissions</span>
              <span>•</span>
              <span>POST /api/submissions/:id/analyze</span>
              <span>•</span>
              <span>GET /api/submissions</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
