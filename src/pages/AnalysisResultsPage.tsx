import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  FileText,
  ShieldAlert,
  Percent,
  ListCheck,
  Scale,
} from 'lucide-react';
import { RawJsonViewer } from '../components/RawJsonViewer';
import type { ExecutionResultData } from '../types/evolyn';

interface Props {
  result: ExecutionResultData | null;
}

export const AnalysisResultsPage: React.FC<Props> = ({ result }) => {
  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Analysis Results Available</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          No backend submission has been performed yet in this session. Submit a PDF document in the Test Workspace to view live analysis results.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to Test Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = result.status === 'Processing successful';
  const hasIssues = result.issues && result.issues.length > 0;
  const hasRules = result.rules && result.rules.length > 0;
  const hasConflicts = result.conflicts && result.conflicts.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Bar with Navigation and Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to Test Workspace"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Analysis Results Viewer
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live inspection of real responses from Evolyn backend
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              result.status === 'Processing successful'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : result.status === 'Processing failed'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {result.status === 'Processing successful' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>{result.status}</span>
          </span>

          {/* Finding Outcome Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              result.findingOutcome === 'Findings detected'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : result.findingOutcome === 'No findings detected'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span>{result.findingOutcome}</span>
          </span>
        </div>
      </div>

      {/* 1. Document & Request Execution Information Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-600" />
          <span>Document & Request Telemetry</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400">Document Name</span>
            <p className="font-semibold text-slate-800 truncate" title={result.documentMeta.name}>
              {result.documentMeta.name}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400">Document Size</span>
            <p className="font-semibold text-slate-800">
              {(result.documentMeta.size / (1024 * 1024)).toFixed(2)} MB ({result.documentMeta.size.toLocaleString()} bytes)
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400">Pages / Chars</span>
            <p className="font-semibold text-slate-800">
              {result.documentMeta.pageCount ?? 'N/A'} pages ({result.documentMeta.extractedTextLength.toLocaleString()} chars)
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400">HTTP Status & Endpoint</span>
            <p className="font-semibold text-slate-800">
              <span className={result.httpStatus === 200 || result.httpStatus === 201 ? 'text-emerald-600' : 'text-rose-600'}>
                {result.httpStatus}
              </span>{' '}
              <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">
                {result.endpointCalled}
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Review Run & Compliance Score Section (When supported by backend) */}
      {result.reviewRun ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Compliance Score</span>
              <Percent className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {result.reviewRun.overallComplianceScore}%
            </div>
            <div className="text-[11px] text-slate-500">
              Computed by Evolyn review engine
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Issues</span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {result.reviewRun.totalIssuesCount}
            </div>
            <div className="text-[11px] text-slate-500">
              Violations / discrepancies flagged
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Passed Checks</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {result.reviewRun.summary.passedChecksCount}
            </div>
            <div className="text-[11px] text-slate-500">
              Rules satisfied
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Failed Checks</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {result.reviewRun.summary.failedChecksCount}
            </div>
            <div className="text-[11px] text-slate-500">
              Rules violated
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Compliance scores and issue metrics are <strong>Not available</strong> for this workflow target (or not returned by backend).
          </span>
        </div>
      )}

      {/* 3. Detected Issues / Findings Section */}
      {result.issues && result.issues.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Detected Issues & Rule Violations ({result.issues.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500">Verbatim findings from backend review run</span>
          </div>

          <div className="space-y-3">
            {result.issues.map((issue, idx) => (
              <div
                key={issue.id || idx}
                className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors bg-white space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-mono">
                      {issue.issueType}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Issue #{idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Confidence: <strong className="text-slate-800">{issue.confidenceScore}</strong></span>
                    <span>Evidence Strength: <strong className="text-slate-800">{issue.evidenceStrengthScore}</strong></span>
                  </div>
                </div>

                {/* Flagged Excerpt */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-2.5 text-xs text-rose-900 font-mono">
                  <span className="text-[10px] uppercase font-bold text-rose-500 block mb-0.5 font-sans">
                    Flagged Excerpt:
                  </span>
                  "{issue.flaggedExcerpt}"
                </div>

                {/* Explanation */}
                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Explanation: </strong>
                  {issue.explanation}
                </p>

                {/* Suggested Fix (if present) */}
                {issue.suggestedFix && (
                  <p className="text-xs text-emerald-800 bg-emerald-50/60 border border-emerald-100 rounded-lg p-2">
                    <strong>Suggested Remediation: </strong>
                    {issue.suggestedFix}
                  </p>
                )}

                {/* Verbatim Source Quote from Guideline Rule / Fact */}
                {issue.sourceQuote && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 italic">
                    <span className="font-semibold text-slate-700 not-italic block mb-0.5">
                      Ground Truth Source Citation:
                    </span>
                    "{issue.sourceQuote}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : result.targetMode === 'submission_review' && isSuccess ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h4 className="text-sm font-bold text-emerald-900">No Findings Detected</h4>
          <p className="text-xs text-emerald-700 max-w-md mx-auto">
            The Evolyn backend analysis executed successfully and detected 0 violations against configured brand rules.
          </p>
        </div>
      ) : null}

      {/* 4. Extracted Rules Section (When guideline workflow tested) */}
      {result.rules && result.rules.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ListCheck className="w-4 h-4 text-indigo-600" />
              <span>Extracted Atomic Rules ({result.rules.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500">POST /api/guidelines/:id/extract-rules</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {result.rules.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className="border border-slate-200 rounded-xl p-3 text-xs bg-slate-50/50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {rule.ruleType}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      rule.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : rule.severity === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {rule.severity}
                  </span>
                </div>
                <p className="font-semibold text-slate-900">{rule.ruleStatement}</p>
                {rule.explanation && (
                  <p className="text-slate-600 text-[11px]">{rule.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Rule Conflicts & Ambiguities Section */}
      {result.conflicts && result.conflicts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Detected Rule Conflicts ({result.conflicts.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500">POST /api/guidelines/:id/detect-conflicts</span>
          </div>

          <div className="space-y-2.5">
            {result.conflicts.map((conflict, idx) => (
              <div
                key={conflict.id || idx}
                className="border border-amber-200 bg-amber-50/40 rounded-xl p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 uppercase text-[10px] bg-amber-100 px-2 py-0.5 rounded">
                    {conflict.conflictType}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Rule Pair: {conflict.ruleAId.slice(0, 8)} ↔ {conflict.ruleBId.slice(0, 8)}
                  </span>
                </div>
                <p className="text-slate-800">{conflict.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Unsupported Modules Notice (Per Specification Rule: Never fabricate) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">Governance Modules Status Matrix:</p>
        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
          <li>Brand Rules & Prohibited Terms: <strong>{hasIssues || hasRules || hasConflicts ? 'Evaluated' : 'Not returned in this run'}</strong></li>
          <li>Unsupported Claims & Citations: <strong>{hasIssues ? 'Audited' : 'Not available'}</strong></li>
          <li>Terminology Lexicon Database: <strong>Not available</strong> (requires knowledge facts integration)</li>
          <li>Human Decision Sign-off: <strong>{result.submission ? 'Pending judge review' : 'Not available'}</strong></li>
        </ul>
      </div>

      {/* 7. Collapsible Raw JSON Response Viewer */}
      <div className="pt-2">
        <RawJsonViewer
          data={result.rawResponse}
          title={`Raw Backend Response (${result.endpointCalled})`}
          defaultExpanded={true}
        />
      </div>
    </div>
  );
};
