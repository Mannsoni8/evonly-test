import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle, CheckCircle, RefreshCcw, Sliders } from 'lucide-react';
import { extractTextFromPDF, ExtractedPDFContent } from '../services/pdfParser';

interface Props {
  file: File | null;
  onFileSelect: (file: File | null, extracted?: ExtractedPDFContent) => void;
  isProcessing: boolean;
  uploadProgress: number;
}

export const FileUploader: React.FC<Props> = ({
  file,
  onFileSelect,
  isProcessing,
  uploadProgress,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [maxSizeMb, setMaxSizeMb] = useState<number>(() => {
    const envVal = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB);
    return !isNaN(envVal) && envVal > 0 ? envVal : 10;
  });
  const [extractedMeta, setExtractedMeta] = useState<ExtractedPDFContent | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = async (selectedFile: File) => {
    setValidationError(null);

    // 1. Strict File Type Validation (MIME and extension)
    const isPdfMime = selectedFile.type === 'application/pdf';
    const isPdfExt = selectedFile.name.toLowerCase().endsWith('.pdf');

    if (!isPdfMime && !isPdfExt) {
      setValidationError(
        `Invalid file type "${selectedFile.type || 'unknown'}". Only genuine PDF documents (*.pdf) are accepted.`
      );
      return;
    }

    // 2. Configurable Max File Size Validation
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      const fileSizeInMb = (selectedFile.size / (1024 * 1024)).toFixed(2);
      setValidationError(
        `File size (${fileSizeInMb} MB) exceeds maximum configured threshold of ${maxSizeMb} MB.`
      );
      return;
    }

    // 3. Inspect & Extract client-side text for document parsing
    setIsExtractingText(true);
    try {
      const extracted = await extractTextFromPDF(selectedFile);
      setExtractedMeta(extracted);
      onFileSelect(selectedFile, extracted);
    } catch (err) {
      // If client-side text extraction fails (e.g. encrypted or malformed PDF), we still allow passing the raw file for multipart
      console.warn('PDF text extraction error:', err);
      const fallbackExtracted = { text: '', numPages: 1 };
      setExtractedMeta(fallbackExtracted);
      onFileSelect(selectedFile, fallbackExtracted);
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setExtractedMeta(null);
    setValidationError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* File Size Limit Config Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100/70 px-3 py-1.5 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span>Configurable Max PDF Size:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="100"
            value={maxSizeMb}
            disabled={isProcessing}
            onChange={(e) => setMaxSizeMb(Math.max(1, Number(e.target.value) || 10))}
            className="w-16 px-1.5 py-0.5 text-xs text-center border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <span className="font-semibold text-slate-700">MB</span>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Validation Failure</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="text-rose-500 hover:text-rose-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Zone */}
      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-brand-500 bg-brand-50/50 scale-[0.99]'
              : 'border-slate-300 hover:border-brand-400 bg-white hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleChange}
            className="hidden"
          />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 border border-brand-100 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h4 className="text-base font-semibold text-slate-800 mb-1">
            Drop your Brand Guidelines or Copy PDF here
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Accepts PDF documents up to {maxSizeMb} MB. File is validated client-side and prepared for Evolyn backend ingestion.
          </p>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-brand-400" />
            <span>Select PDF File</span>
          </button>
        </div>
      ) : (
        /* Selected File Card & Preview */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 break-all">{file.name}</h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Validated PDF
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Size: <strong className="text-slate-700">{formatFileSize(file.size)}</strong></span>
                  <span>Type: <strong className="text-slate-700">{file.type || 'application/pdf'}</strong></span>
                  {extractedMeta?.numPages && (
                    <span>Pages: <strong className="text-slate-700">{extractedMeta.numPages}</strong></span>
                  )}
                  {extractedMeta?.text && (
                    <span>Characters: <strong className="text-slate-700">{extractedMeta.text.length}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Remove / Replace File Controls */}
            {!isProcessing && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Replace file"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  title="Remove file"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Text Extraction Status indicator */}
          {isExtractingText && (
            <div className="text-xs text-blue-600 flex items-center gap-2 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
              <span className="animate-spin text-base">⏳</span>
              <span>Extracting document textual contents for Evolyn backend ingestion...</span>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isProcessing && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Upload & Submission Progress</span>
                <span className="font-mono text-brand-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
