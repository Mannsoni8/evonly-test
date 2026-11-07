import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, RefreshCw, ArrowUpRight, AlertCircle } from 'lucide-react';
import { evolynApi } from '../services/api';
import type { ContentSubmission, ExecutionResultData } from '../types/evolyn';

interface Props {
  onSelectSubmissionForInspection: (result: ExecutionResultData) => void;
}

export const ExecutionHistoryPage: React.FC<Props> = ({
  onSelectSubmissionForInspection,
}) => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inspectingId, setInspectingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await evolynApi.listSubmissions();
      setSubmissions(res.submissions || []);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to retrieve submission history from Evolyn backend (GET /api/submissions)';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleInspect = async (sub: ContentSubmission) => {
    setInspectingId(sub.id);
    try {
      // Fetch the actual review and issues for this submission
      const reviewRes = await evolynApi.getSubmissionReview(sub.id);

      const inspectionData: ExecutionResultData = {
        targetMode: 'submission_review',
        documentMeta: {
          name: sub.title,
          size: sub.rawText.length,
          type: 'text/markdown',
          lastModified: new Date(sub.updatedAt || sub.createdAt).getTime(),
          extractedTextLength: sub.rawText.length,
          pageCount: 1,
        },
        status: 'Processing successful',
        findingOutcome:
          reviewRes.issues && reviewRes.issues.length > 0 ? 'Findings detected' : 'No findings detected',
        httpStatus: 200,
        endpointCalled: `/api/submissions/${sub.id}/review`,
        timestamp: sub.createdAt,
        submission: reviewRes.submission || sub,
        reviewRun: reviewRes.reviewRun,
        issues: reviewRes.issues,
        rawResponse: reviewRes,
      };

      onSelectSubmissionForInspection(inspectionData);
      navigate('/results');
    } catch (err: any) {
      // If review is not found (e.g. submitted but not yet analyzed)
      const rawSub = await evolynApi.getSubmissionById(sub.id).catch(() => ({ submission: sub }));

      const inspectionData: ExecutionResultData = {
        targetMode: 'submission_review',
        documentMeta: {
          name: sub.title,
          size: sub.rawText.length,
          type: 'text/plain',
          lastModified: new Date(sub.createdAt).getTime(),
          extractedTextLength: sub.rawText.length,
          pageCount: 1,
        },
        status: sub.status === 'COMPLETED' ? 'Processing successful' : 'Processing status unavailable',
        findingOutcome: 'Status unavailable',
        httpStatus: 200,
        endpointCalled: `/api/submissions/${sub.id}`,
        timestamp: sub.createdAt,
        submission: rawSub.submission,
        rawResponse: rawSub,
      };

      onSelectSubmissionForInspection(inspectionData);
      navigate('/results');
    } finally {
      setInspectingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Execution History
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              GET /api/submissions
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Records of previously submitted documents and real execution statuses from Evolyn.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Backend Communication Notice</p>
            <p>{error}</p>
            <p className="text-[11px] text-amber-700">
              Ensure Evolyn API is running at the configured endpoint (default <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">http://localhost:5001</code>).
            </p>
          </div>
        </div>
      )}

      {/* Submissions Table / Cards */}
      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mx-auto" />
          <p className="text-xs text-slate-500">Fetching history from Evolyn backend...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <History className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Submissions Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The Evolyn backend currently contains no submissions. Submit a PDF document from the Test Workspace to create records.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Document Title</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Submitted By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 truncate max-w-xs">
                      {sub.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {sub.id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {sub.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {sub.submittedBy}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === 'COMPLETED' || sub.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : sub.status === 'REJECTED' || sub.status === 'FAILED'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                    {new Date(sub.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleInspect(sub)}
                      disabled={inspectingId === sub.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors"
                    >
                      <span>{inspectingId === sub.id ? 'Loading...' : 'Inspect'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
