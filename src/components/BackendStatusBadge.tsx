import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, Settings, Database, Cpu } from 'lucide-react';
import { evolynApi, getBaseApiUrl, setBaseApiUrl } from '../services/api';
import type { ConnectionState, HealthResponse } from '../types/evolyn';

interface Props {
  onStatusChange?: (state: ConnectionState, data?: HealthResponse) => void;
}

export const BackendStatusBadge: React.FC<Props> = ({ onStatusChange }) => {
  const [status, setStatus] = useState<ConnectionState>('checking');
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [latency, setLatency] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState(getBaseApiUrl());

  const checkConnection = async () => {
    setStatus('checking');
    const start = performance.now();
    try {
      const res = await evolynApi.checkHealth();
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);

      if (res.isConnected && res.data) {
        setHealthData(res.data);
        if (res.data.database === 'disconnected') {
          setStatus('degraded');
          onStatusChange?.('degraded', res.data);
        } else {
          setStatus('connected');
          onStatusChange?.('connected', res.data);
        }
        setErrorMessage('');
      } else {
        setStatus('disconnected');
        setHealthData(null);
        setErrorMessage(res.error || 'Backend not responding');
        onStatusChange?.('disconnected');
      }
    } catch (err) {
      setStatus('disconnected');
      setHealthData(null);
      setErrorMessage(err instanceof Error ? err.message : 'Connection failed');
      onStatusChange?.('disconnected');
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setBaseApiUrl(apiUrl);
    setIsModalOpen(false);
    checkConnection();
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          status === 'connected'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : status === 'degraded'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : status === 'checking'
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {status === 'connected' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === 'connected'
                ? 'bg-emerald-500'
                : status === 'degraded'
                ? 'bg-amber-500'
                : status === 'checking'
                ? 'bg-blue-500'
                : 'bg-rose-500'
            }`}
          ></span>
        </span>

        <span className="capitalize font-semibold tracking-wide">
          {status === 'connected'
            ? 'Backend Connected'
            : status === 'degraded'
            ? 'Backend Degraded (DB Offline)'
            : status === 'checking'
            ? 'Checking Connection...'
            : 'Backend Disconnected'}
        </span>

        {latency !== null && status === 'connected' && (
          <span className="text-[10px] text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded">
            {latency}ms
          </span>
        )}
      </div>

      <button
        onClick={checkConnection}
        title="Refresh connection status"
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
      </button>

      <button
        onClick={() => setIsModalOpen(true)}
        title="Configure Evolyn API URL"
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      {/* Backend Settings & Diagnostic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-slate-900">Backend Connection Config</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Evolyn API Base URL
                </label>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:5001"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Default Evolyn development backend runs at <code className="bg-slate-100 px-1 py-0.5 rounded">http://localhost:5001</code>.
                </p>
              </div>

              {healthData && (
                <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2 border border-slate-200">
                  <div className="font-semibold text-slate-700 flex items-center justify-between">
                    <span>Live Health Diagnostics</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">
                      {healthData.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Database className="w-3.5 h-3.5" />
                    <span>Database:</span>
                    <span
                      className={`font-medium ${
                        healthData.database === 'connected' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {healthData.database}
                    </span>
                  </div>
                  {healthData.gemini && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Gemini AI:</span>
                      <span className="font-medium text-slate-800">
                        {healthData.gemini.model} ({healthData.gemini.configured ? 'Configured' : 'Missing Key'})
                      </span>
                    </div>
                  )}
                  {healthData.uptime !== undefined && (
                    <div className="text-[11px] text-slate-500">
                      Uptime: {healthData.uptime}s | Service: {healthData.service}
                    </div>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <strong>Connection Error:</strong> {errorMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
                >
                  Save & Re-test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
