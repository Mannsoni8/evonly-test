// Verified Evolyn Backend Contracts & Domain Types

export type ConnectionState = 'connected' | 'disconnected' | 'checking' | 'degraded';

export interface HealthResponse {
  status: 'ok' | string;
  service: string;
  timestamp: string;
  uptime?: number;
  database: 'connected' | 'disconnected' | string;
  gemini?: {
    model: string;
    embeddingModel: string;
    configured: boolean;
  };
}

export type GuidelineCategory = 'TONE' | 'TERMINOLOGY' | 'CLAIMS' | 'LEGAL' | 'GENERAL';
export type GuidelineStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
export type RuleType = 'MANDATORY' | 'PROHIBITED' | 'RECOMMENDED' | 'CONDITIONAL';
export type SeverityLevel = 'CRITICAL' | 'WARNING' | 'SUGGESTION';

export interface Guideline {
  id: string;
  title: string;
  category: GuidelineCategory;
  version: string;
  rawContent: string;
  s3Url?: string | null;
  status: GuidelineStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GuidelineRule {
  id: string;
  guidelineId: string;
  ruleType: RuleType;
  ruleStatement: string;
  explanation?: string;
  severity: SeverityLevel;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface GuidelineConflict {
  id: string;
  ruleAId: string;
  ruleBId: string;
  conflictType: 'CONTRADICTION' | 'AMBIGUITY' | 'OVERLAP' | string;
  explanation: string;
  severity: SeverityLevel;
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
  createdAt: string;
}

export interface ExtractRulesResponse {
  guidelineId: string;
  rules: GuidelineRule[];
  total: number;
}

export interface DetectConflictsResponse {
  guidelineId: string;
  conflicts: GuidelineConflict[];
  total: number;
}

export type SubmissionChannel = 'WEBSITE' | 'SOCIAL' | 'EMAIL' | 'AD' | 'OTHER';
export type SubmissionStatus = 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED' | 'APPROVED' | 'REJECTED';

export interface ContentSubmission {
  id: string;
  title: string;
  channel: SubmissionChannel;
  rawText: string;
  fileUrl?: string | null;
  submittedBy: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export type IssueType =
  | 'TONE_VIOLATION'
  | 'PROHIBITED_PHRASE'
  | 'UNSUPPORTED_CLAIM'
  | 'OUTDATED_FACT'
  | 'LEGAL_RISK'
  | 'STYLE_INCONSISTENCY';

export type IssueStatus = 'OPEN' | 'ACCEPTED' | 'DISMISSED';

export interface DetectedIssue {
  id?: string;
  reviewRunId?: string;
  ruleId?: string | null;
  factId?: string | null;
  issueType: IssueType;
  flaggedExcerpt: string;
  charStart?: number | null;
  charEnd?: number | null;
  explanation: string;
  suggestedFix?: string;
  sourceQuote: string;
  confidenceScore: number;
  evidenceStrengthScore: number;
  status: IssueStatus;
}

export interface ReviewRun {
  id: string;
  submissionId: string;
  overallComplianceScore: number;
  totalIssuesCount: number;
  modelUsed?: string;
  summary: {
    passedChecksCount: number;
    failedChecksCount: number;
    notes?: string;
  };
  createdAt: string;
}

export interface AnalyzeSubmissionResponse {
  reviewRunId: string;
  submissionId: string;
  overallComplianceScore: number;
  totalIssuesCount: number;
  summary: {
    passedChecksCount: number;
    failedChecksCount: number;
    notes?: string;
  };
  issues: DetectedIssue[];
}

export interface ReviewDetailsResponse {
  submission: ContentSubmission;
  reviewRun: ReviewRun;
  issues: DetectedIssue[];
  decision?: {
    id: string;
    submissionId: string;
    decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
    reviewerName: string;
    comments: string;
    overriddenIssueIds: string[];
    createdAt: string;
  } | null;
}

export interface ListSubmissionsResponse {
  submissions: ContentSubmission[];
  total: number;
}

export interface ListGuidelinesResponse {
  guidelines: Guideline[];
  total?: number;
}

// Frontend Execution States
export type ExecutionStage =
  | 'idle'
  | 'validating_file'
  | 'extracting_pdf_text'
  | 'uploading'
  | 'submitting_to_backend'
  | 'analyzing'
  | 'success'
  | 'error';

export interface PDFMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  extractedTextLength: number;
  pageCount?: number;
}

export interface ExecutionResultData {
  targetMode: 'submission_review' | 'guideline_ingestion' | 'multipart_upload';
  documentMeta: PDFMetadata;
  status: 'Request successful' | 'Processing successful' | 'Processing failed' | 'Processing status unavailable';
  findingOutcome: 'Findings detected' | 'No findings detected' | 'Status unavailable';
  httpStatus: number;
  endpointCalled: string;
  timestamp: string;
  submission?: ContentSubmission;
  reviewRun?: ReviewRun;
  issues?: DetectedIssue[];
  guideline?: Guideline;
  rules?: GuidelineRule[];
  conflicts?: GuidelineConflict[];
  rawResponse: unknown;
  errorDetails?: string;
}
