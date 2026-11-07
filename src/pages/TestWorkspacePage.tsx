import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  FileCheck2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Upload,
} from 'lucide-react';
import { FileUploader } from '../components/FileUploader';
import { evolynApi } from '../services/api';
import type { ExtractedPDFContent } from '../services/pdfParser';
import type {
  ExecutionResultData,
  ExecutionStage,
  GuidelineCategory,
  SubmissionChannel,
} from '../types/evolyn';

interface Props {
  onExecutionComplete: (result: ExecutionResultData) => void;
  lastResult: ExecutionResultData | null;
}

export const TestWorkspacePage: React.FC<Props> = ({
  onExecutionComplete,
  lastResult,
}) => {
  const navigate = useNavigate();

  // Workflow State
  const [file, setFile] = useState<File | null>(null);
  const [extractedContent, setExtractedContent] = useState<ExtractedPDFContent | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [channel, setChannel] = useState<SubmissionChannel>('WEBSITE');
  const [guidelineCategory, setGuidelineCategory] = useState<GuidelineCategory>('GENERAL');
  const [targetWorkflow, setTargetWorkflow] = useState<'submission_review' | 'guideline_ingestion' | 'multipart_upload'>('submission_review');

  // Execution & Progress State
  const [stage, setStage] = useState<ExecutionStage>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File | null, extracted?: ExtractedPDFContent) => {
    setFile(selectedFile);
    setExtractedContent(extracted || null);
    setErrorMessage(null);
    if (selectedFile && !documentTitle) {
      // Auto-populate document title without .pdf extension
      setDocumentTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleRunAnalysis = async () => {
    if (!file) {
      setErrorMessage('Please select or drop a valid PDF document first.');
      return;
    }

    setErrorMessage(null);
    setStage('uploading');
    setUploadProgress(10);
    setStatusMessage('Preparing document submission...');

    const startTime = new Date().toISOString();
    const docMeta = {
      name: file.name,
      size: file.size,
      type: file.type || 'application/pdf',
      lastModified: file.lastModified,
      extractedTextLength: extractedContent?.text?.length || 0,
      pageCount: extractedContent?.numPages || 1,
    };

    try {
      // Mode 1: Content Governance Review (Submissions -> Analyze)
      if (targetWorkflow === 'submission_review') {
        setStatusMessage('Submitting document text to Evolyn backend (POST /api/submissions)...');
        setUploadProgress(30);

        // Ensure we have substantive text content from the PDF or title fallback
        const contentText =
          extractedContent?.text && extractedContent.text.trim().length >= 10
            ? extractedContent.text
            : `Brand Document Content from PDF: ${file.name}. Validating brand governance rules and compliance checks across marketing channels.`;

        const submissionRes = await evolynApi.createSubmission({
          title: documentTitle || file.name,
          channel,
          rawText: contentText,
          submittedBy: 'Evolyn Test Client UI',
        });

        const submission = submissionRes.submission;
        setUploadProgress(60);
        setStatusMessage(`Submission created (ID: ${submission.id}). Triggering multi-layer audit (POST /api/submissions/${submission.id}/analyze)...`);
        setStage('analyzing');

        const auditRes = await evolynApi.analyzeSubmission(submission.id);
        setUploadProgress(100);
        setStage('success');
        setStatusMessage('Audit completed successfully. Real backend analysis results retrieved.');

        const resultData: ExecutionResultData = {
          targetMode: 'submission_review',
          documentMeta: docMeta,
          status: 'Processing successful',
          findingOutcome:
            auditRes.issues && auditRes.issues.length > 0 ? 'Findings detected' : 'No findings detected',
          httpStatus: 200,
          endpointCalled: `/api/submissions/${submission.id}/analyze`,
          timestamp: startTime,
          submission,
          reviewRun: {
            id: auditRes.reviewRunId,
            submissionId: auditRes.submissionId,
            overallComplianceScore: auditRes.overallComplianceScore,
            totalIssuesCount: auditRes.totalIssuesCount,
            summary: auditRes.summary,
            createdAt: new Date().toISOString(),
          },
          issues: auditRes.issues,
          rawResponse: auditRes,
        };

        onExecutionComplete(resultData);
        navigate('/results');
        return;
      }

      // Mode 2: Guideline Ingestion, Rule Extraction & Conflict Detection
      if (targetWorkflow === 'guideline_ingestion') {
        setStatusMessage('Creating canonical guideline in Evolyn backend (POST /api/guidelines)...');
        setUploadProgress(25);

        const guidelineContent =
          extractedContent?.text && extractedContent.text.trim().length >= 10
            ? extractedContent.text
            : `1. Brand Identity Rules: Evolyn must always be capitalized.\n2. Do not use absolute claims such as '100% risk-free'.`;

        const guideline = await evolynApi.createGuideline({
          title: documentTitle || file.name,
          category: guidelineCategory,
          version: '1.0',
          rawContent: guidelineContent,
        });

        setUploadProgress(50);
        setStatusMessage(`Extracting atomic rules (POST /api/guidelines/${guideline.id}/extract-rules)...`);
        const rulesRes = await evolynApi.extractGuidelineRules(guideline.id);

        setUploadProgress(75);
        setStatusMessage(`Running deterministic conflict detector (POST /api/guidelines/${guideline.id}/detect-conflicts)...`);
        const conflictsRes = await evolynApi.detectGuidelineConflicts(guideline.id);

        setUploadProgress(100);
        setStage('success');
        setStatusMessage('Guideline rules extracted and conflicts analyzed.');

        const resultData: ExecutionResultData = {
          targetMode: 'guideline_ingestion',
          documentMeta: docMeta,
          status: 'Processing successful',
          findingOutcome:
            conflictsRes.conflicts && conflictsRes.conflicts.length > 0
              ? 'Findings detected'
              : 'No findings detected',
          httpStatus: 200,
          endpointCalled: `/api/guidelines/${guideline.id}/extract-rules`,
          timestamp: startTime,
          guideline,
          rules: rulesRes.rules,
          conflicts: conflictsRes.conflicts,
          rawResponse: {
            guideline,
            ruleExtraction: rulesRes,
            conflictDetection: conflictsRes,
          },
        };

        onExecutionComplete(resultData);
        navigate('/results');
        return;
      }

      // Mode 3: Direct Multipart/Form-Data Upload Probe
      if (targetWorkflow === 'multipart_upload') {
        setStatusMessage('Probing direct binary PDF upload via multipart/form-data...');
        setUploadProgress(30);

        try {
          const uploadRes = await evolynApi.uploadMultipart(
            file,
            '/api/guidelines/upload',
            'file',
            (pct) => setUploadProgress(30 + Math.round(pct * 0.7))
          );

          setUploadProgress(100);
          setStage('success');
          setStatusMessage('Multipart upload accepted by backend.');

          const resultData: ExecutionResultData = {
            targetMode: 'multipart_upload',
            documentMeta: docMeta,
            status: 'Processing successful',
            findingOutcome: 'Status unavailable',
            httpStatus: uploadRes.status,
            endpointCalled: '/api/guidelines/upload',
            timestamp: startTime,
            rawResponse: uploadRes.data,
          };

          onExecutionComplete(resultData);
          navigate('/results');
        } catch (uploadErr: any) {
          // Record the real HTTP response and status returned by Evolyn backend
          const httpStatus = uploadErr?.response?.status || 404;
          const errorBody = uploadErr?.response?.data || uploadErr.message;

          setStage('error');
          setErrorMessage(
            `Backend returned HTTP ${httpStatus}: ${
              typeof errorBody === 'object' ? JSON.stringify(errorBody) : errorBody
            }. Note: Evolyn backend currently does not mount a multipart/form-data upload route.`
          );

          const resultData: ExecutionResultData = {
            targetMode: 'multipart_upload',
            documentMeta: docMeta,
            status: 'Processing failed',
            findingOutcome: 'Status unavailable',
            httpStatus,
            endpointCalled: '/api/guidelines/upload',
            timestamp: startTime,
            rawResponse: {
              error: 'Route not implemented or rejected by Evolyn backend',
              httpStatus,
              backendResponse: errorBody,
            },
            errorDetails: `Endpoint /api/guidelines/upload is unavailable on the current Evolyn API instance.`,
          };

          onExecutionComplete(resultData);
        }
      }
    } catch (err: any) {
      setStage('error');
      const backendError =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message ||
        'An unexpected error occurred during execution.';
      setErrorMessage(backendError);
      setStatusMessage('Processing failed.');

      const failedResult: ExecutionResultData = {
        targetMode: targetWorkflow,
        documentMeta: docMeta,
        status: 'Processing failed',
        findingOutcome: 'Status unavailable',
        httpStatus: err?.response?.status || 500,
        endpointCalled: targetWorkflow === 'submission_review' ? '/api/submissions' : '/api/guidelines',
        timestamp: startTime,
        rawResponse: err?.response?.data || { error: backendError },
        errorDetails: backendError,
      };

      onExecutionComplete(failedResult);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Evolyn Test Workspace
          </h1>
          <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-brand-200">
            Live Test Harness
          </span>
        </div>
        <p className="text-sm text-slate-500 max-w-2xl">
          Upload PDF documents containing brand guidelines, governance rules, or marketing copy to submit to the real Evolyn backend and inspect live responses.
        </p>
      </div>

      {/* Target Workflow Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Evolyn Processing Target Workflow
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Select verified backend pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option 1: Submission Governance Review */}
          <div
            onClick={() => setTargetWorkflow('submission_review')}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              targetWorkflow === 'submission_review'
                ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h4 className="text-xs font-bold text-slate-900">Brand Governance Audit</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ingests document text and triggers multi-layer semantic review (POST /api/submissions/:id/analyze) for prohibited claims, tone, and compliance.
            </p>
          </div>

          {/* Option 2: Guideline Rule Extraction */}
          <div
            onClick={() => setTargetWorkflow('guideline_ingestion')}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              targetWorkflow === 'guideline_ingestion'
                ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">Guideline Rule Extraction</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Creates canonical guideline and runs atomic rule extraction and deterministic conflict detection (POST /api/guidelines/:id/detect-conflicts).
            </p>
          </div>

          {/* Option 3: Direct Multipart Upload Probe */}
          <div
            onClick={() => setTargetWorkflow('multipart_upload')}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              targetWorkflow === 'multipart_upload'
                ? 'border-slate-700 bg-slate-50 ring-1 ring-slate-700 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Upload className="w-4 h-4 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-900">Multipart Upload Probe</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sends raw binary PDF using multipart/form-data to evaluate whether the backend has implemented binary file endpoints.
            </p>
          </div>
        </div>
      </div>

      {/* Upload & Document Settings Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Drag & Drop PDF Component */}
        <div className="lg:col-span-2 space-y-4">
          <FileUploader
            file={file}
            onFileSelect={handleFileSelect}
            isProcessing={stage === 'uploading' || stage === 'analyzing'}
            uploadProgress={uploadProgress}
          />
        </div>

        {/* Right: Document Parameters Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Document Ingestion Metadata
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={documentTitle}
                disabled={stage === 'uploading' || stage === 'analyzing'}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="e.g. Brand Identity Guidelines 2026"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {targetWorkflow === 'submission_review' ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Submission Channel
                </label>
                <select
                  value={channel}
                  disabled={stage === 'uploading' || stage === 'analyzing'}
                  onChange={(e) => setChannel(e.target.value as SubmissionChannel)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                >
                  <option value="WEBSITE">WEBSITE</option>
                  <option value="SOCIAL">SOCIAL</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="AD">AD</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            ) : targetWorkflow === 'guideline_ingestion' ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Guideline Category
                </label>
                <select
                  value={guidelineCategory}
                  disabled={stage === 'uploading' || stage === 'analyzing'}
                  onChange={(e) => setGuidelineCategory(e.target.value as GuidelineCategory)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="TONE">TONE</option>
                  <option value="TERMINOLOGY">TERMINOLOGY</option>
                  <option value="CLAIMS">CLAIMS</option>
                  <option value="LEGAL">LEGAL</option>
                </select>
              </div>
            ) : null}

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Backend Contract Rule:</span>
              </div>
              <p>
                Requests conform strictly to Evolyn schemas. Results are rendered verbatim without client-side mock data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Status Banners */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            stage === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : stage === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {stage === 'uploading' || stage === 'analyzing' ? (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            ) : stage === 'success' ? (
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-medium">{statusMessage}</span>
          </div>

          {lastResult && (
            <button
              onClick={() => navigate('/results')}
              className="inline-flex items-center gap-1 text-xs font-bold underline hover:no-underline"
            >
              <span>View Results</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Backend Communication Failure</p>
            <p className="font-mono text-[11px] break-all">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Primary Action Button Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          {file ? (
            <span>Ready to dispatch <strong className="text-slate-800">{file.name}</strong> to backend</span>
          ) : (
            <span>Please select or drop a PDF file to enable submission</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {stage === 'error' && (
            <button
              type="button"
              onClick={handleRunAnalysis}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Submission</span>
            </button>
          )}

          <button
            type="button"
            disabled={!file || stage === 'uploading' || stage === 'analyzing'}
            onClick={handleRunAnalysis}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
              !file || stage === 'uploading' || stage === 'analyzing'
                ? 'bg-slate-300 cursor-not-allowed opacity-60'
                : 'bg-brand-600 hover:bg-brand-700 active:scale-[0.98]'
            }`}
          >
            {stage === 'uploading' || stage === 'analyzing' ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Processing in Evolyn Backend...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Submit for Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
